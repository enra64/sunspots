import asyncio

import aiohttp
import pytest
from aiohttp import web
from aiohttp.test_utils import TestServer

from custom_components.sunspots.core.providers.base import (
    HttpStatusError,
    ProviderLimitError,
    ProviderUnavailable,
)
from custom_components.sunspots.core.providers.http import RateLimitedFetcher

DATA = bytes(range(256)) * 40


class Clock:
    def __init__(self):
        self.t = 0.0
        self.sleeps = []

    def now(self):
        return self.t

    async def sleep(self, s):
        self.sleeps.append(s)
        self.t += s


@pytest.fixture
async def server(socket_enabled):
    state = {"calls": 0, "ua": [], "mode": "ok"}

    async def handler(request: web.Request):
        state["calls"] += 1
        state["ua"].append(request.headers.get("User-Agent"))
        mode = state["mode"]
        if mode == "429" and state["calls"] == 1:
            return web.Response(status=429, headers={"Retry-After": "7"})
        if mode == "500":
            return web.Response(status=503)
        if mode == "403":
            return web.Response(status=403)
        if mode == "ignore-range":
            return web.Response(body=DATA)
        rng = request.headers.get("Range")
        if rng:
            a, b = rng[6:].split("-")
            return web.Response(status=206, body=DATA[int(a) : int(b) + 1])
        return web.Response(body=DATA)

    app = web.Application()
    app.router.add_route("*", "/f", handler)
    srv = TestServer(app)
    await srv.start_server()
    yield srv, state
    await srv.close()


def make(session, clock, **kw):
    return RateLimitedFetcher(
        session, "Sunspots/test (+x)", clock=clock.now, sleep=clock.sleep, **kw
    )


async def test_range_get_ua_and_rate_cap(server):
    srv, state = server
    clock = Clock()
    async with aiohttp.ClientSession() as session:
        f = make(session, clock)
        url = str(srv.make_url("/f"))
        assert await f.get(url, start=10, length=5, max_bytes=100) == DATA[10:15]
        assert await f.get(url, start=0, length=3, max_bytes=100) == DATA[0:3]
    assert state["ua"] == ["Sunspots/test (+x)"] * 2
    assert clock.sleeps and clock.sleeps[0] == pytest.approx(1.0)  # >= 1 s between requests


async def test_retry_after_honoured(server):
    srv, state = server
    state["mode"] = "429"
    clock = Clock()
    async with aiohttp.ClientSession() as session:
        data = await make(session, clock).get(str(srv.make_url("/f")), max_bytes=100_000)
    assert data == DATA and state["calls"] == 2
    assert 7.0 in clock.sleeps


async def test_persistent_5xx_gives_up_and_403_fails_fast(server):
    srv, state = server
    state["mode"] = "500"
    async with aiohttp.ClientSession() as session:
        f = make(session, Clock())
        with pytest.raises(HttpStatusError) as err:
            await f.get(str(srv.make_url("/f")), max_bytes=100_000)
        assert err.value.status == 503 and state["calls"] == 4
        state["mode"], state["calls"] = "403", 0
        with pytest.raises(HttpStatusError):
            await f.get(str(srv.make_url("/f")), max_bytes=100_000)
        assert state["calls"] == 1


async def test_size_cap_and_ignored_range(server):
    srv, state = server
    async with aiohttp.ClientSession() as session:
        f = make(session, Clock())
        with pytest.raises(ProviderLimitError):
            await f.get(str(srv.make_url("/f")), max_bytes=100)
        state["mode"] = "ignore-range"
        with pytest.raises(ProviderLimitError):
            await f.get(str(srv.make_url("/f")), start=0, length=10, max_bytes=100)


async def test_hourly_cap(server):
    srv, _ = server
    async with aiohttp.ClientSession() as session:
        f = make(session, Clock(), max_per_hour=2)
        url = str(srv.make_url("/f"))
        await f.get(url, max_bytes=100_000)
        await f.get(url, max_bytes=100_000)
        with pytest.raises(ProviderLimitError):
            await f.get(url, max_bytes=100_000)


async def test_connection_error_becomes_provider_unavailable(socket_enabled):
    clock = Clock()
    async with aiohttp.ClientSession() as session:
        f = make(session, clock)
        with pytest.raises(ProviderUnavailable):
            await f.get("http://127.0.0.1:9/x", max_bytes=10)


async def test_concurrency_is_serialised(server):
    srv, _ = server
    clock = Clock()
    async with aiohttp.ClientSession() as session:
        f = make(session, clock)
        url = str(srv.make_url("/f"))
        await asyncio.gather(*(f.get(url, max_bytes=100_000) for _ in range(3)))
    assert len(clock.sleeps) == 2
