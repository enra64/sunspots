"""Fetch-or-cache orchestration for building data (shared by flows and coordinators)."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import SOURCE_OVERPASS, SOURCE_OVERTURE, USER_AGENT_TEMPLATE
from .core.providers import overpass, overture_pmtiles
from .core.providers.base import Chunk, ProviderError, RangeFetcher
from .core.providers.http import RateLimitedFetcher
from .data import HubSettings, TileCache

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class ChunkSet:
    """Chunks covering a spot, plus the provider they came from."""

    provider: str
    chunks: list[Chunk]

    @property
    def release(self) -> str | None:
        releases = [c.release for c in self.chunks if c.release]
        return max(releases) if releases else None

    @property
    def fetched_at(self) -> str:
        return min((c.fetched_at for c in self.chunks), default="")

    @property
    def keys(self) -> list[str]:
        return [c.key for c in self.chunks]


class BuildingsService:
    """Loads chunks from the tile cache and fetches missing ones from the provider."""

    def __init__(
        self, hass: HomeAssistant, tiles: TileCache, settings: HubSettings, version: str
    ) -> None:
        self._tiles = tiles
        self._lock = asyncio.Lock()  # one fetch at a time: concurrent spots share cached tiles
        self._settings = settings
        self._fetcher: RangeFetcher = RateLimitedFetcher(
            async_get_clientsession(hass), USER_AGENT_TEMPLATE.format(version=version)
        )
        self._overture = overture_pmtiles.OvertureProvider(self._fetcher)
        self._overpass = overpass.OverpassProvider(self._fetcher)

    async def async_from_cache(
        self, lat: float, lon: float, radius: float, provider: str | None = None
    ) -> ChunkSet | None:
        """Chunks for a spot from the cache only (never the network); None if incomplete."""
        source = provider or self._settings.data_source
        if source == SOURCE_OVERPASS:
            chunk = await self._tiles.async_get(overpass.chunk_key(lat, lon, radius))
            return ChunkSet(SOURCE_OVERPASS, [chunk]) if chunk else None
        chunks: list[Chunk] = []
        for key, _x, _y in overture_pmtiles.keys_for(lat, lon, radius):
            chunk = await self._tiles.async_get(key)
            if chunk is None:
                return None
            chunks.append(chunk)
        return ChunkSet(SOURCE_OVERTURE, chunks)

    async def async_fetch(
        self,
        lat: float,
        lon: float,
        radius: float,
        *,
        refresh: bool = False,
    ) -> ChunkSet:
        """Ensure chunks are cached (fetching missing ones, or all when refreshing).

        Raises ProviderError when the configured source fails and the Overpass fallback
        is not permitted (or fails as well).
        """
        async with self._lock:
            if self._settings.data_source == SOURCE_OVERPASS:
                return await self._fetch_overpass(lat, lon, radius, refresh)
            try:
                return await self._fetch_overture(lat, lon, radius, refresh)
            except ProviderError as err:
                if not self._settings.allow_overpass:
                    raise
                _LOGGER.warning("Overture tiles unavailable (%s); using Overpass as permitted", err)
                return await self._fetch_overpass(lat, lon, radius, refresh)

    async def _fetch_overture(
        self, lat: float, lon: float, radius: float, refresh: bool
    ) -> ChunkSet:
        chunks: list[Chunk] = []
        release: str | None = None
        for key, x, y in overture_pmtiles.keys_for(lat, lon, radius):
            cached = None if refresh else await self._tiles.async_get(key)
            if cached is not None:
                chunks.append(cached)
                continue
            if release is None:
                release = await self._overture.latest_release()
            chunk = await self._overture.fetch_chunk(release, x, y)
            await self._tiles.async_put(chunk)
            chunks.append(chunk)
        return ChunkSet(SOURCE_OVERTURE, chunks)

    async def _fetch_overpass(
        self, lat: float, lon: float, radius: float, refresh: bool
    ) -> ChunkSet:
        key = overpass.chunk_key(lat, lon, radius)
        cached = None if refresh else await self._tiles.async_get(key)
        if cached is None:
            cached = await self._overpass.fetch_chunk(lat, lon, radius)
            await self._tiles.async_put(cached)
        return ChunkSet(SOURCE_OVERPASS, [cached])
