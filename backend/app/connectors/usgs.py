from datetime import datetime, timezone

import httpx

from ..models import Event
from .base import Connector, RawRecord

FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"


def magnitude_to_severity(mag: float) -> int:
    if mag >= 6.5:
        return 5
    if mag >= 5.5:
        return 4
    if mag >= 4.5:
        return 3
    if mag >= 3.0:
        return 2
    return 1


def _ts(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


class UsgsConnector(Connector):
    name = "usgs"
    interval_seconds = 60

    async def fetch(self) -> list[RawRecord]:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(FEED_URL)
            resp.raise_for_status()
            data = resp.json()
        return [RawRecord(f["id"], f) for f in data.get("features", [])]

    def normalize(self, record: RawRecord) -> Event | None:
        f = record.payload
        p = f.get("properties", {})
        coords = (f.get("geometry") or {}).get("coordinates")
        if p.get("mag") is None or not coords or p.get("time") is None:
            return None

        lon, lat = coords[0], coords[1]
        depth = coords[2] if len(coords) > 2 else None
        mag = float(p["mag"])
        reviewed = p.get("status") == "reviewed"
        confidence = 0.8 if reviewed else 0.6
        explanation = (
            f"USGS magnitude {mag:.1f}, status {p.get('status', 'unknown')}. "
            f"Single source, so confidence is capped."
        )

        return Event(
            id=f"usgs:{record.external_id}",
            type="earthquake",
            title=p.get("title") or f"M {mag:.1f} earthquake",
            severity=magnitude_to_severity(mag),
            confidence=confidence,
            lat=lat,
            lon=lon,
            start_time=_ts(p["time"]),
            updated_time=_ts(p.get("updated") or p["time"]),
            sources=["usgs"],
            explanation=explanation,
            properties={
                "magnitude": mag,
                "depth_km": depth,
                "place": p.get("place"),
                "url": p.get("url"),
                "tsunami": bool(p.get("tsunami")),
                "felt": p.get("felt"),
            },
        )
