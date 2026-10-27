"""Edge cases of the rate-limited HTTP fetcher."""

import aiohttp
import pytest
from aiohttp import web
from aiohttp.test_utils import TestServer

from custom_components.sunspots.core.providers.base import ProviderLimitError
from custom_components.sunspots.core.providers.http import RateLimitedFetcher


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
    seen = []

    async def echo(request: web.Request):
        seen.append((request.method, await request.text(), request.headers.get("User-Agent")))
        return web.Response(text="ok")

    async def chunked(request: web.Request):
        resp = web.StreamResponse()  # no Content-Length: size can only be checked while streaming
        await resp.prepare(request)
        for _ in range(4):
            await resp.write(b"x" * 100)
        return resp

    app = web.Application()
    app.router.add_post("/echo", echo)
    app.router.add_get("/chunked", chunked)
    srv = TestServer(app)
    await srv.start_server()
    yield srv, seen
    await srv.close()


def make(session, clock, **kw):
    return RateLimitedFetcher(session, "UA/1", clock=clock.now, sleep=clock.sleep, **kw)


async def test_start_without_length_is_a_value_error(server):
    srv, _ = server
    async with aiohttp.ClientSession() as session:
        with pytest.raises(ValueError, match="length required"):
            await make(session, Clock()).get(str(srv.make_url("/echo")), start=5, max_bytes=10)


async def test_post_sends_body_and_user_agent(server):
    srv, seen = server
    async with aiohttp.ClientSession() as session:
        body = await make(session, Clock()).post(
            str(srv.make_url("/echo")), "data=abc", max_bytes=100
        )
    assert body == b"ok" and seen == [("POST", "data=abc", "UA/1")]


async def test_old_history_expires_from_hourly_cap(server):
    srv, _ = server
    clock = Clock()
    url = str(srv.make_url("/echo"))
    async with aiohttp.ClientSession() as session:
        f = make(session, clock, max_per_hour=2)
        await f.post(url, "a", max_bytes=100)
        await f.post(url, "b", max_bytes=100)
        with pytest.raises(ProviderLimitError):
            await f.post(url, "c", max_bytes=100)
        clock.t += 3601  # both earlier requests fall out of the one hour window
        assert await f.post(url, "d", max_bytes=100) == b"ok"


async def test_streamed_body_over_limit_without_content_length(server):
    srv, _ = server
    async with aiohttp.ClientSession() as session:
        f = make(session, Clock())
        with pytest.raises(ProviderLimitError, match="larger than 250"):
            await f.get(str(srv.make_url("/chunked")), max_bytes=250)
        assert len(await f.get(str(srv.make_url("/chunked")), max_bytes=1000)) == 400


async def test_ignored_range_on_a_small_file_never_returns_the_wrong_bytes(socket_enabled):
    """A 200 answer to a ranged request starts at byte 0: wrong data for any other offset."""
    body = bytes(range(64))

    async def handler(request: web.Request):
        return web.Response(body=body)  # ignores Range

    app = web.Application()
    app.router.add_get("/small", handler)
    srv = TestServer(app)
    await srv.start_server()
    try:
        async with aiohttp.ClientSession() as session:
            f = RateLimitedFetcher(session, "ua", min_interval=0)
            url = str(srv.make_url("/small"))
            with pytest.raises(ProviderLimitError):
                await f.get(url, start=10, length=64, max_bytes=64)
            assert await f.get(url, start=0, length=64, max_bytes=64) == body
    finally:
        await srv.close()
