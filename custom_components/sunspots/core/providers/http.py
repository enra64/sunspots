"""Polite, rate-limited HTTP client for provider requests (aiohttp)."""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable
from urllib.parse import urlsplit

import aiohttp

from .base import HttpStatusError, ProviderLimitError, ProviderUnavailable

MIN_INTERVAL_S = 1.0
MAX_REQUESTS_PER_HOUR = 600
MAX_RETRIES = 3
MAX_RETRY_AFTER_S = 120.0
TIMEOUT_S = 30.0
_RETRY_STATUSES = frozenset({429, 500, 502, 503, 504})


class RateLimitedFetcher:
    """Implements ``RangeFetcher``: concurrency 1, <= 1 request/s per host, hourly cap, backoff."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        user_agent: str,
        *,
        clock: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
        min_interval: float = MIN_INTERVAL_S,
        max_per_hour: int = MAX_REQUESTS_PER_HOUR,
    ) -> None:
        self._session = session
        self._ua = user_agent
        self._clock = clock
        self._sleep = sleep
        self._min_interval = min_interval
        self._max_per_hour = max_per_hour
        self._lock = asyncio.Lock()
        self._last: dict[str, float] = {}
        self._history: dict[str, deque[float]] = defaultdict(deque)

    async def get(
        self, url: str, *, start: int | None = None, length: int | None = None, max_bytes: int
    ) -> bytes:
        headers = {"User-Agent": self._ua}
        if start is not None:
            if length is None:
                raise ValueError("length required with start")
            headers["Range"] = f"bytes={start}-{start + length - 1}"
            max_bytes = min(max_bytes, length)
        return await self._request("GET", url, headers, None, max_bytes, start=start)

    async def post(self, url: str, data: str, *, max_bytes: int) -> bytes:
        return await self._request("POST", url, {"User-Agent": self._ua}, data, max_bytes)

    async def _throttle(self, host: str) -> None:
        now = self._clock()
        history = self._history[host]
        while history and now - history[0] > 3600:
            history.popleft()
        if len(history) >= self._max_per_hour:
            raise ProviderLimitError(f"hourly request cap reached for {host}")
        wait = self._last.get(host, -1e9) + self._min_interval - now
        if wait > 0:
            await self._sleep(wait)
        self._last[host] = self._clock()
        history.append(self._last[host])

    async def _request(
        self,
        method: str,
        url: str,
        headers: dict[str, str],
        data: str | None,
        max_bytes: int,
        *,
        start: int | None = None,
    ) -> bytes:
        host = urlsplit(url).netloc
        async with self._lock:
            delay = 2.0
            for attempt in range(MAX_RETRIES + 1):
                await self._throttle(host)
                try:
                    return await self._once(method, url, headers, data, max_bytes, start)
                except HttpStatusError as err:
                    if err.status not in _RETRY_STATUSES or attempt == MAX_RETRIES:
                        raise
                    wait = min(getattr(err, "retry_after", None) or delay, MAX_RETRY_AFTER_S)
                except (TimeoutError, aiohttp.ClientError) as err:
                    if attempt == MAX_RETRIES:
                        raise ProviderUnavailable(f"{type(err).__name__} fetching {host}") from err
                    wait = delay
                await self._sleep(wait)
                delay *= 2
        raise ProviderUnavailable("unreachable")  # pragma: no cover

    async def _once(
        self,
        method: str,
        url: str,
        headers: dict[str, str],
        data: str | None,
        max_bytes: int,
        start: int | None,
    ) -> bytes:
        timeout = aiohttp.ClientTimeout(total=TIMEOUT_S)
        async with self._session.request(
            method, url, headers=headers, data=data, timeout=timeout
        ) as resp:
            if resp.status not in (200, 206):
                err = HttpStatusError(resp.status, url)
                retry_after = resp.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    err.retry_after = float(retry_after)  # type: ignore[attr-defined]
                raise err
            declared = resp.headers.get("Content-Length")
            # Server ignored Range: the body starts at byte 0, so it only answers a request for
            # the start of a small, sized file (size cap below); never download a whole archive.
            ignored_range = start is not None and resp.status == 200
            if ignored_range and (start != 0 or not (declared and declared.isdigit())):
                raise ProviderLimitError("server ignored Range request")
            if declared and declared.isdigit() and int(declared) > max_bytes:
                raise ProviderLimitError(f"response larger than {max_bytes} bytes")
            body = bytearray()
            async for chunk in resp.content.iter_chunked(65536):
                body.extend(chunk)
                if len(body) > max_bytes:
                    raise ProviderLimitError(f"response larger than {max_bytes} bytes")
            return bytes(body)
