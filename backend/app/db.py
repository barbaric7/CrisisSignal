from pathlib import Path

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from . import config

if not config.DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy .env.example to .env and paste your "
        "Supabase connection string."
    )

pool = AsyncConnectionPool(
    config.DATABASE_URL,
    open=False,
    min_size=1,
    max_size=4,
    # prepare_threshold=None keeps it compatible with Supabase poolers
    kwargs={"row_factory": dict_row, "prepare_threshold": None},
)

SCHEMA_SQL = (Path(__file__).parent / "schema.sql").read_text()


async def open_pool() -> None:
    # wait=True fails fast with a clear error if the connection string is wrong
    await pool.open(wait=True, timeout=30)


async def init_db() -> None:
    async with pool.connection() as conn:
        await conn.execute(SCHEMA_SQL)
