import asyncio
import logging
from datetime import datetime, timezone

from psycopg.types.json import Jsonb

from . import config
from .connectors.base import Connector, RawRecord
from .db import pool
from .events_bus import bus

log = logging.getLogger("ingest")

RAW_BULK_UPSERT = """
INSERT INTO raw_events (source, external_id, payload)
SELECT %(source)s::text, x.external_id, x.payload
FROM jsonb_to_recordset(%(batch)s::jsonb) AS x(external_id text, payload jsonb)
ON CONFLICT (source, external_id)
DO UPDATE SET payload = EXCLUDED.payload, fetched_at = now()
RETURNING (xmax = 0) AS inserted
"""

BATCH_SIZE = 500


def _chunks(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


EVENT_UPSERT = """
INSERT INTO events (id, type, title, severity, confidence, lat, lon,
                    start_time, updated_time, sources, explanation, properties)
VALUES (%(id)s, %(type)s, %(title)s, %(severity)s, %(confidence)s,
        %(lat)s, %(lon)s, %(start_time)s, %(updated_time)s, %(sources)s,
        %(explanation)s, %(properties)s)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    severity = EXCLUDED.severity,
    confidence = EXCLUDED.confidence,
    updated_time = EXCLUDED.updated_time,
    explanation = EXCLUDED.explanation,
    properties = EXCLUDED.properties
WHERE events.updated_time < EXCLUDED.updated_time
RETURNING id
"""

LOG_INSERT = """
INSERT INTO ingestion_log (source, started_at, status, fetched, new_raw, error)
VALUES (%s, %s, %s, %s, %s, %s)
"""


async def fetch_with_retry(connector: Connector) -> list[RawRecord]:
    """Retry with exponential backoff: waits 2s, 6s, 18s ..."""
    delay = 2
    for attempt in range(1, config.FETCH_RETRIES + 1):
        try:
            return await connector.fetch()
        except Exception as exc:
            log.warning(
                "%s fetch failed (attempt %d/%d): %r",
                connector.name, attempt, config.FETCH_RETRIES, exc,
            )
            if attempt == config.FETCH_RETRIES:
                raise
            await asyncio.sleep(delay)
            delay *= 3
    return []


async def _write_log(source, started, status, fetched=0, new_raw=0, error=None):
    async with pool.connection() as conn:
        await conn.execute(
            LOG_INSERT, (source, started, status, fetched, new_raw, error)
        )


async def run_connector(connector: Connector) -> None:
    started = datetime.now(timezone.utc)
    try:
        records = await fetch_with_retry(connector)
    except Exception as exc:
        log.error("%s: giving up this cycle: %r", connector.name, exc)
        await _write_log(connector.name, started, "error", error=repr(exc)[:500])
        return

    # a single statement cannot touch the same key twice, so de-duplicate first
    unique = {rec.external_id: rec for rec in records}
    rows = [
        {"external_id": r.external_id, "payload": r.payload} for r in unique.values()
    ]

    new_raw = 0
    published = 0
    async with pool.connection() as conn:
        # 1) raw records, saved in bulk (one round trip per 500 rows)
        for chunk in _chunks(rows, BATCH_SIZE):
            cur = await conn.execute(
                RAW_BULK_UPSERT,
                {"source": connector.name, "batch": Jsonb(chunk)},
            )
            new_raw += sum(1 for row in await cur.fetchall() if row["inserted"])

        # 2) processed events (only sources that implement normalize())
        for rec in unique.values():
            try:
                event = connector.normalize(rec)
            except Exception:
                log.exception("%s: normalize failed for %s", connector.name, rec.external_id)
                continue
            if event is None:
                continue
            params = event.model_dump()
            params["properties"] = Jsonb(params["properties"])
            cur = await conn.execute(EVENT_UPSERT, params)
            if await cur.fetchone():
                published += 1
                await bus.publish(event)

    await _write_log(connector.name, started, "ok", len(records), new_raw)
    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    log.info(
        "%s: fetched=%d new_raw=%d events_updated=%d (%.1fs)",
        connector.name, len(records), new_raw, published, elapsed,
    )