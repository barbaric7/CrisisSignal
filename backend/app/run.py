"""
Run the live ingestion scheduler (keeps running until Ctrl+C).

    python -m app.run
"""
import asyncio
import logging
import sys
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from apscheduler.schedulers.asyncio import AsyncIOScheduler  # noqa: E402

from .connectors import CONNECTORS  # noqa: E402
from .db import init_db, open_pool, pool  # noqa: E402
from .ingest import run_connector  # noqa: E402

Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler("logs/ingestion.log", maxBytes=2_000_000, backupCount=3),
    ],
)
log = logging.getLogger("run")


async def main() -> None:
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
            next_run_time=datetime.now(timezone.utc),  # run once immediately
            max_instances=1,
            coalesce=True,
            id=c.name,
        )
        log.info("scheduled %s every %ds", c.name, c.interval_seconds)
    scheduler.start()

    try:
        await asyncio.Event().wait()  # run forever
    finally:
        scheduler.shutdown(wait=False)
        await pool.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("stopped")
