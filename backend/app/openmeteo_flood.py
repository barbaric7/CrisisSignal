import asyncio
import logging
from datetime import datetime, timezone

import httpx

from .. import config
from ..locations import LOCATIONS
from .base import Connector, RawRecord

log = logging.getLogger("flood")

URL = "https://flood-api.open-meteo.com/v1/flood"
PARAMS = {
    "daily": "river_discharge,river_discharge_max",
    "past_days": 7,
    "forecast_days": 7,
}


class FloodConnector(Connector):
    """River discharge (m3/s) from GloFAS via Open-Meteo: 7 days past + 7 days forecast.

    Stored raw for now. The processing layer will compare forecast flow with
    recent flow to flag rising-river flood risk.
    """

    name = "flood"
    interval_seconds = 3 * 60 * 60

    async def fetch(self) -> list[RawRecord]:
        records: list[RawRecord] = []
        errors: list[str] = []
        today = datetime.now(timezone.utc).date().isoformat()
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
                if not (data.get("daily") or {}).get("river_discharge"):
                    continue
                records.append(
                    RawRecord(f"{loc['id']}_{today}", {"location": loc, **data})
                )
                await asyncio.sleep(0.15)
        if errors:
            log.warning("flood: %d locations failed, e.g. %s", len(errors), errors[:2])
        if not records:
            raise RuntimeError(f"No flood data fetched: {errors[:3]}")
        return records