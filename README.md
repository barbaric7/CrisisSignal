# CrisisSignal - Ingestion into Supabase (no Docker)

## One-time setup (Windows)
1. Create a free project at https://supabase.com (remember the database password).
2. Supabase: click **Connect** -> copy the **Session pooler** connection string.
3. Copy `.env.example` to `.env`; paste it as DATABASE_URL (insert your password).
4. Get a FIRMS key (link in `.env.example`) and paste it as FIRMS_MAP_KEY.
5. Terminal in this folder (Python 3.11 or 3.12 recommended):
       py -m venv .venv
       .venv\Scripts\activate
       pip install -r backend\requirements.txt
       cd backend

## Run
    python -m app.cli usgs      test one source (also: firms, sachet)
    python -m app.cli all       run every source once
    python -m app.cli status    show what is stored
    python -m app.run           run forever on the schedule (Ctrl+C to stop)

Tables appear automatically. See the data in Supabase -> Table Editor:
`raw_events`, `ingestion_log`, `events`.

Logs: `backend/logs/ingestion.log`. Retries: 3 tries (waits 2s, 6s).

## Optional later
    python serve.py     REST API at http://127.0.0.1:8000/docs (for the dashboard)
