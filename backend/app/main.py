import asyncio
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .connectors import CONNECTORS
from .db import init_db, open_pool, pool
from .events_bus import bus
from .ingest import run_connector
from .models import Event

Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler("logs/ingestion.log", maxBytes=2_000_000, backupCount=3),
    ],
)
log = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_pool()
    await init_db()

    scheduler = AsyncIOScheduler()
    for c in CONNECTORS:
        if not c.enabled():
            log.warning("connector %s disabled (missing config)", c.name)
            continue
        scheduler.add_job(
            run_connector,
            "interval",
            seconds=c.interval_seconds,
            args=[c],
            next_run_time=datetime.now(timezone.utc),
            max_instances=1,
            coalesce=True,
            id=c.name,
        )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await pool.close()


app = FastAPI(title="CrisisSignal API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

COLUMNS = (
    "id, type, title, severity, confidence, lat, lon, start_time, "
    "updated_time, sources, explanation, properties"
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "connectors": {c.name: c.enabled() for c in CONNECTORS},
    }


@app.get("/api/ingestion/status")
async def ingestion_status():
    async with pool.connection() as conn:
        cur = await conn.execute(
            """SELECT DISTINCT ON (source) source, status, started_at,
                      finished_at, fetched, new_raw, error
               FROM ingestion_log ORDER BY source, id DESC"""
        )
        last_runs = await cur.fetchall()
        cur = await conn.execute(
            """SELECT source, count(*) AS total, max(fetched_at) AS last_seen
               FROM raw_events GROUP BY source ORDER BY source"""
        )
        raw_counts = await cur.fetchall()
    return {"last_runs": last_runs, "raw_counts": raw_counts}


@app.get("/api/raw")
async def list_raw(source: str | None = None, limit: int = Query(20, ge=1, le=200)):
    async with pool.connection() as conn:
        cur = await conn.execute(
            """SELECT id, source, external_id, fetched_at, payload FROM raw_events
               WHERE (%(source)s::text IS NULL OR source = %(source)s)
               ORDER BY id DESC LIMIT %(limit)s""",
            {"source": source, "limit": limit},
        )
        return await cur.fetchall()


@app.get("/api/events", response_model=list[Event])
async def list_events(
    type: str | None = None,
    min_severity: int = Query(1, ge=1, le=5),
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(500, ge=1, le=2000),
):
    sql = f"""
        SELECT {COLUMNS} FROM events
        WHERE severity >= %(min_severity)s
          AND start_time >= now() - make_interval(hours => %(hours)s)
          AND (%(type)s::text IS NULL OR type = %(type)s)
        ORDER BY start_time DESC
        LIMIT %(limit)s
    """
    async with pool.connection() as conn:
        cur = await conn.execute(
            sql,
            {"min_severity": min_severity, "hours": hours, "type": type, "limit": limit},
        )
        return await cur.fetchall()


@app.get("/api/events/stream")
async def stream_events():
    async def gen():
        q = bus.subscribe()
        try:
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"data: {event.model_dump_json()}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            bus.unsubscribe(q)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
