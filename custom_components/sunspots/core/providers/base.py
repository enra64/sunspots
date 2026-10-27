"""Provider-neutral types: chunks of raw features, errors, fetcher protocol."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from ..buildings import RawFeature

OVERTURE_ATTRIBUTION = "© OpenStreetMap contributors, Overture Maps Foundation"
OSM_ATTRIBUTION = "© OpenStreetMap contributors"


class ProviderError(Exception):
    """Base class for building-data errors."""


class ProviderUnavailable(ProviderError):
    """Network failure, bad status or rate limit."""


class ProviderSchemaError(ProviderError):
    """Data does not look like what we expect (format or attributes changed)."""


class ProviderLimitError(ProviderError):
    """A size or request-rate safety limit was hit."""


class HttpStatusError(ProviderUnavailable):
    """Non-success HTTP status."""

    def __init__(self, status: int, url: str) -> None:
        super().__init__(f"HTTP {status} for {url}")
        self.status = status


class RangeFetcher(Protocol):
    """Minimal HTTP client used by providers (rate-limited implementation in http.py)."""

    async def get(
        self, url: str, *, start: int | None = None, length: int | None = None, max_bytes: int
    ) -> bytes: ...

    async def post(self, url: str, data: str, *, max_bytes: int) -> bytes: ...


@dataclass(slots=True)
class Chunk:
    """A cacheable unit of raw features (one Overture tile or one Overpass area)."""

    key: str
    provider: str  # "overture" | "overpass"
    release: str | None
    fetched_at: str  # ISO 8601
    features: list[RawFeature]

    @property
    def attribution(self) -> str:
        return OVERTURE_ATTRIBUTION if self.provider == "overture" else OSM_ATTRIBUTION

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "provider": self.provider,
            "release": self.release,
            "fetched_at": self.fetched_at,
            "features": [f.to_dict() for f in self.features],
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Chunk:
        return cls(
            d["key"],
            d["provider"],
            d["release"],
            d["fetched_at"],
            [RawFeature.from_dict(f) for f in d["features"]],
        )
