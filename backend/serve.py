"""Optional: start the REST API (needed later for the dashboard).  python serve.py"""
import asyncio
import sys

import uvicorn

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

if __name__ == "__main__":
    # loop="none" keeps the selector loop policy set above (needed by psycopg on Windows)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, loop="none")
