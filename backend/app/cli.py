"""
Run ingestion once, then exit.

    python -m app.cli usgs      (or firms / sachet)
    python -m app.cli all       run every enabled source once
    python -m app.cli status    show last runs + stored record counts
"""
import asyncio
import logging
import sys

if sys.platform == "win32":  # psycopg async needs the selector loop on Windows
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from .connectors import CONNECTORS  # noqa: E402
from .db import init_db, open_pool, pool  # noqa: E402
from .ingest import run_connector  # noqa: E402

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)


async def show_status() -> None:
    async with pool.connection() as conn:
        cur = await conn.execute(
            """SELECT source, count(*) AS total, max(fetched_at) AS last_seen
               FROM raw_events GROUP BY source ORDER BY source"""
        )
        rows = await cur.fetchall()
        print("\nStored raw records:")
        for r in rows:
            print(f"  {r['source']:<8} {r['total']:>7} rows   last: {r['last_seen']}")
        if not rows:
            print("  (nothing yet)")

        cur = await conn.execute(
            """SELECT DISTINCT ON (source) source, status, finished_at,
                      fetched, new_raw, error
               FROM ingestion_log ORDER BY source, id DESC"""
        )
        print("\nLast run per source:")
        for r in await cur.fetchall():
            line = f"  {r['source']:<8} {r['status']:<6} fetched={r['fetched']} new={r['new_raw']}"
            if r["error"]:
                line += f"  error={r['error'][:80]}"
            print(line)


async def main(arg: str) -> None:
    await open_pool()
    await init_db()
    try:
        if arg == "status":
            await show_status()
        elif arg == "all":
            for c in CONNECTORS:
                if c.enabled():
                    await run_connector(c)
                else:
                    print(f"skipping {c.name} (missing config)")
            await show_status()
        else:
            c = next((c for c in CONNECTORS if c.name == arg), None)
            if c is None:
                sys.exit(f"Unknown: {arg!r}. Use {[x.name for x in CONNECTORS]}, all, status")
            if not c.enabled():
                sys.exit(f"{arg} is disabled (missing config, e.g. FIRMS_MAP_KEY)")
            await run_connector(c)
            await show_status()
    finally:
        await pool.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1]))
