import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

from .. import config
from ..locations import LOCATIONS
from ..models import Event
from .base import Connector, RawRecord

log = logging.getLogger("weather")

URL = "https://api.open-meteo.com/v1/forecast"
PARAMS = {
    "current": "temperature_2m,relative_humidity_2m,precipitation,rain,"
    "wind_speed_10m,wind_gusts_10m",
    "daily": "precipitation_sum,precipitation_probability_max",
    "forecast_days": 3,
    "timezone": "Asia/Kolkata",
}


def rain_severity(mm_24h: float) -> int | None:
    """IMD 24-hour rainfall classes. Below 64.5 mm is not an event."""
    if mm_24h >= 204.5:
        return 5  # extremely heavy
    if mm_24h >= 115.6:
        return 4  # very heavy
    if mm_24h >= 64.5:
        return 3  # heavy
    return None


class WeatherConnector(Connector):
    """Open-Meteo current weather and 3-day rain forecast for key places."""

    name = "weather"
    interval_seconds = 30 * 60

    async def fetch(self) -> list[RawRecord]:
        records: list[RawRecord] = []
        errors: list[str] = []
        async with httpx.AsyncClient(
            timeout=config.HTTP_TIMEOUT, headers={"User-Agent": config.USER_AGENT}
        ) as client:
            for loc in LOCATIONS:
                try:
                    resp = await client.get(
                        URL,
                        params={**PARAMS, "latitude": loc["lat"], "longitude": loc["lon"]},
                    )
                    resp.raise_for_status()
                    data = resp.json()
                except Exception as exc:
                    errors.append(f"{loc['id']}: {exc!r}")
                    continue
                current = data.get("current") or {}
                if not current.get("time"):
                    continue
                payload = {"location": loc, **data}
                records.append(RawRecord(f"{loc['id']}_{current['time']}", payload))
                await asyncio.sleep(0.15)
        if errors:
            log.warning("weather: %d locations failed, e.g. %s", len(errors), errors[:2])
        if not records:
            raise RuntimeError(f"No weather data fetched: {errors[:3]}")
        return records

    def normalize(self, record: RawRecord) -> Event | None:
        p = record.payload
        loc = p["location"]
        daily = p.get("daily") or {}
        times = daily.get("time") or []
        sums = daily.get("precipitation_sum") or []
        if not times or not sums or sums[0] is None:
            return None
        mm = float(sums[0])
        severity = rain_severity(mm)
        if severity is None:
            return None

        tz = timezone(timedelta(seconds=p.get("utc_offset_seconds", 19800)))
        day_start = datetime.fromisoformat(times[0]).replace(tzinfo=tz)
        updated = datetime.fromisoformat(p["current"]["time"]).replace(tzinfo=tz)
        prob = (daily.get("precipitation_probability_max") or [None])[0]

        return Event(
            id=f"weather:{loc['id']}:{times[0]}",
            type="rain",
            title=f"Heavy rain forecast: {loc['name']} ({mm:.0f} mm today)",
            severity=severity,
            confidence=0.5,
            lat=loc["lat"],
            lon=loc["lon"],
            start_time=day_start,
            updated_time=updated,
            sources=["open-meteo"],
            explanation=(
                f"Open-Meteo model forecasts {mm:.1f} mm of rain today "
                f"(IMD heavy-rain threshold is 64.5 mm). Single model source, "
                f"so confidence is capped at 0.5."
            ),
            properties={
                "rain_24h_mm": mm,
                "rain_probability_max": prob,
                "temperature_c": p["current"].get("temperature_2m"),
                "wind_gust_kmh": p["current"].get("wind_gusts_10m"),
                "location": loc["name"],
            },
        )