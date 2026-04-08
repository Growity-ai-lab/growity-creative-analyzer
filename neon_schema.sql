-- Growity Creative Analyzer — Neon Schema
-- Neon dashboard > SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS analyses (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         TIMESTAMPTZ DEFAULT now(),
  creative_name      TEXT NOT NULL,
  client_name        TEXT,
  notes              TEXT,
  file_type          TEXT,
  roi_scores         JSONB,
  n_timesteps        INTEGER,
  processing_seconds NUMERIC,
  status             TEXT
);

CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_client_name_idx ON analyses (client_name);
