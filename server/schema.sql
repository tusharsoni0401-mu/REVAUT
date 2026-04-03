-- ============================================================
-- RevAut — Database Schema
-- Run this once in the Supabase SQL Editor to create all tables
-- ============================================================

-- ── locations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  address         TEXT        NOT NULL,
  cuisine_type    TEXT        NOT NULL,
  gbp_connected   BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT        PRIMARY KEY,
  location_id TEXT        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  author      TEXT        NOT NULL,
  avatar      TEXT        NOT NULL,
  rating      INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  date        TIMESTAMPTZ NOT NULL,
  text        TEXT        NOT NULL,
  sentiment   TEXT        NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  platform    TEXT        NOT NULL CHECK (platform IN ('google', 'tripadvisor')),
  status      TEXT        NOT NULL CHECK (status IN ('pending', 'approved', 'posted', 'rejected')),
  topics      TEXT[]      NOT NULL DEFAULT '{}',
  priority    TEXT        NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  is_backfill BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_location_id_idx ON reviews(location_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx      ON reviews(status);
CREATE INDEX IF NOT EXISTS reviews_date_idx        ON reviews(date DESC);

-- ── ai_responses ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_responses (
  id               TEXT        PRIMARY KEY,
  review_id        TEXT        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  text             TEXT        NOT NULL,
  confidence_score NUMERIC(4,2) NOT NULL,
  evaluator_scores JSONB       NOT NULL DEFAULT '{}',
  version          INTEGER     NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_responses_review_id_idx ON ai_responses(review_id);

-- ── brand_voice_settings ─────────────────────────────────────
-- Single row for MVP (no per-user auth yet).
-- id is always 'default'.
CREATE TABLE IF NOT EXISTS brand_voice_settings (
  id               TEXT        PRIMARY KEY DEFAULT 'default',
  tone             JSONB       NOT NULL DEFAULT '{"formality":[40],"playfulness":[50],"brevity":[40]}',
  persona          TEXT        NOT NULL DEFAULT 'A warm and professional restaurant manager who genuinely cares about every guest''s experience.',
  examples         TEXT[]      NOT NULL DEFAULT '{}',
  include_keywords TEXT[]      NOT NULL DEFAULT '{}',
  avoid_keywords   TEXT[]      NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default brand voice row so it always exists
INSERT INTO brand_voice_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
