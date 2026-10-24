import csv
import io

import httpx

from .. import config
from .base import Connector, RawRecord


def parse_firms_csv(text: str) -> list[RawRecord]:
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or "latitude" not in reader.fieldnames:
        # FIRMS returns plain-text errors (bad key, rate limit) instead of CSV
        raise ValueError(f"Unexpected FIRMS response: {text[:200]!r}")
    records = []
    for row in reader:
        ext_id = "_".join(
            [
                row["latitude"],
                row["longitude"],
                row.get("acq_date", ""),
                row.get("acq_time", ""),
                row.get("satellite", ""),
            ]
        )
        records.append(RawRecord(ext_id, dict(row)))
    return records


class FirmsConnector(Connector):
    """NASA FIRMS active fire detections (replaces Bhuvan fire alerts)."""

    name = "firms"
    interval_seconds = 15 * 60

    def enabled(self) -> bool:
        return bool(config.FIRMS_MAP_KEY)

    async def fetch(self) -> list[RawRecord]:
        url = (
            "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
            f"{config.FIRMS_MAP_KEY}/{config.FIRMS_PRODUCT}/{config.FIRMS_BBOX}/2"
        )
        async with httpx.AsyncClient(
            timeout=config.HTTP_TIMEOUT, headers={"User-Agent": config.USER_AGENT}
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        return parse_firms_csv(resp.text)
