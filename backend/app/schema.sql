-- Raw records exactly as fetched from each source
CREATE TABLE IF NOT EXISTS raw_events (
    id           BIGSERIAL PRIMARY KEY,
    source       TEXT NOT NULL,
    external_id  TEXT NOT NULL,
    fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload      JSONB NOT NULL,
    UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS raw_source_time_idx ON raw_events (source, fetched_at DESC);

-- Processed events (filled by the processing stage; USGS only for now)
CREATE TABLE IF NOT EXISTS events (
    id            TEXT PRIMARY KEY,
    type          TEXT NOT NULL,
    title         TEXT NOT NULL,
    severity      SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    confidence    REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    lat           DOUBLE PRECISION NOT NULL,
    lon           DOUBLE PRECISION NOT NULL,
    start_time    TIMESTAMPTZ NOT NULL,
    updated_time  TIMESTAMPTZ NOT NULL,
    sources       TEXT[] NOT NULL,
    explanation   TEXT NOT NULL DEFAULT '',
    properties    JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS events_time_idx ON events (start_time DESC);
CREATE INDEX IF NOT EXISTS events_type_idx ON events (type);

-- One row per ingestion run (success or error)
CREATE TABLE IF NOT EXISTS ingestion_log (
    id           BIGSERIAL PRIMARY KEY,
    source       TEXT NOT NULL,
    started_at   TIMESTAMPTZ NOT NULL,
    finished_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    status       TEXT NOT NULL,
    fetched      INT NOT NULL DEFAULT 0,
    new_raw      INT NOT NULL DEFAULT 0,
    error        TEXT
);
CREATE INDEX IF NOT EXISTS ingestion_log_idx ON ingestion_log (source, id DESC);

-- Supabase exposes public tables through its REST API. Turning on RLS with
-- no policies blocks that public access. Our Python backend connects as the
-- database owner, so it is not affected.
ALTER TABLE raw_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_log ENABLE ROW LEVEL SECURITY;
