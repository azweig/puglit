-- Puglit — genetic / RPG multi-team schema (Phase 1 foundation).
-- Three competing teams (islands), 75 persistent agents with RPG stats + a learning diary,
-- a per-project dependency graph (Postgres adjacency = Neo4j stand-in, pluggable later),
-- and tournament rounds (diverge → cross-optimize → converge+QA).
-- Local default; the same shape backs a Neo4j/Obsidian deployment when hardware allows.

CREATE TABLE IF NOT EXISTS puglit_teams (
  id           VARCHAR(8) PRIMARY KEY,            -- 'A' | 'B' | 'C'
  philosophy   VARCHAR(40) NOT NULL,              -- 'lean' | 'ddd' | 'hacker'
  label        VARCHAR(80) NOT NULL,
  description  TEXT NOT NULL,
  queen_agent  VARCHAR(64),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 75 persistent agents: 3 teams × 25 roles. Each has a personality, RPG stats, level/xp,
-- and an accumulated quality reputation (the Queen's opinion over many projects).
CREATE TABLE IF NOT EXISTS puglit_agents (
  id            VARCHAR(64) PRIMARY KEY,          -- e.g. 'A:backend-engineer'
  team          VARCHAR(8) NOT NULL REFERENCES puglit_teams(id),
  role          VARCHAR(48) NOT NULL,             -- base role id (shared across teams)
  name          VARCHAR(80) NOT NULL,
  room          VARCHAR(16) NOT NULL,             -- ti | design | business | management
  persona       TEXT NOT NULL,                    -- pixel-art + behavioural persona
  queen         BOOLEAN NOT NULL DEFAULT FALSE,
  stakeholder   BOOLEAN NOT NULL DEFAULT FALSE,
  -- RPG stats (1..10) → drive Ollama params (creativity→temperature, rigor→determinism)
  stats         JSONB NOT NULL,                   -- {creativity,rigor,security,speed,depth}
  temperature   DOUBLE PRECISION NOT NULL,        -- derived from stats (per-call default)
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,
  projects      INTEGER NOT NULL DEFAULT 0,       -- # projects worked
  wins          INTEGER NOT NULL DEFAULT 0,       -- # tournament rounds their team won
  quality_sum   DOUBLE PRECISION NOT NULL DEFAULT 0, -- running sum of Queen quality scores
  quality_n     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puglit_agents_team ON puglit_agents(team);

-- The agent's "diary of life": lessons accumulated per project → few-shot for next time.
CREATE TABLE IF NOT EXISTS puglit_agent_diary (
  id          BIGSERIAL PRIMARY KEY,
  agent_id    VARCHAR(64) NOT NULL REFERENCES puglit_agents(id),
  job_id      VARCHAR(32),
  kind        VARCHAR(16) NOT NULL DEFAULT 'lesson', -- lesson | win | critique | note
  entry       TEXT NOT NULL,
  quality     DOUBLE PRECISION,                   -- Queen's score for this contribution (0..10)
  embedding   JSONB,                              -- lesson "gene" vector (nomic-embed) for relevance retrieval
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diary_agent ON puglit_agent_diary(agent_id, created_at DESC);
-- idempotent: add embedding to diaries created before this column existed
ALTER TABLE puglit_agent_diary ADD COLUMN IF NOT EXISTS embedding JSONB;

-- Per-project deliverable dependency graph (adjacency list; swap for Neo4j at scale).
CREATE TABLE IF NOT EXISTS puglit_dep_graph (
  id          BIGSERIAL PRIMARY KEY,
  job_id      VARCHAR(32) NOT NULL,
  team        VARCHAR(8),
  node        VARCHAR(200) NOT NULL,              -- e.g. 'route:app/api/status'
  depends_on  VARCHAR(200) NOT NULL,              -- e.g. 'table:components'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dep_job ON puglit_dep_graph(job_id);

-- Tournament rounds: 3 teams compete; the Stakeholder panel scores and picks a winner.
CREATE TABLE IF NOT EXISTS puglit_rounds (
  id          BIGSERIAL PRIMARY KEY,
  job_id      VARCHAR(32) NOT NULL,
  iteration   INTEGER NOT NULL,                   -- 1 diverge | 2 cross-optimize | 3 converge+QA
  team        VARCHAR(8) NOT NULL,
  role        VARCHAR(16) NOT NULL,               -- 'builder' | 'qa'
  score       DOUBLE PRECISION,                   -- panel score 0..100
  winner      BOOLEAN NOT NULL DEFAULT FALSE,
  notes       TEXT,
  artifacts   JSONB,                              -- snapshot of files / report for this team+iter
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rounds_job ON puglit_rounds(job_id, iteration);

-- ── Platform auth (passwordless magic-code). Multi-user beta. ──────────────────
CREATE TABLE IF NOT EXISTS puglit_users (
  email       VARCHAR(255) PRIMARY KEY,
  name        VARCHAR(120),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_login  TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS puglit_login_codes (
  email       VARCHAR(255) NOT NULL,
  code_hash   VARCHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_codes_email ON puglit_login_codes(email, created_at DESC);

-- ── Module registry: the living directory the swarm reads/reuses/extends ───────
CREATE TABLE IF NOT EXISTS puglit_modules (
  name        VARCHAR(64) PRIMARY KEY,
  category    VARCHAR(24) NOT NULL,        -- channel | integration | util | agent
  description TEXT NOT NULL,
  when_to_use TEXT,
  env_vars    JSONB,                       -- string[]
  deps        JSONB,                       -- { pkg: version }
  gateway     VARCHAR(120),                -- docker service it needs, if any
  files       JSONB NOT NULL,              -- [{ path, content }]
  version     INTEGER NOT NULL DEFAULT 1,
  status      VARCHAR(16) NOT NULL DEFAULT 'stable', -- stable | new | improved
  created_by  VARCHAR(64),                 -- which agent/team created/improved it
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Metrics: measure Puglit by evidence (build/smoke/judge-agreement/ablation) ──
CREATE TABLE IF NOT EXISTS puglit_metrics (
  id BIGSERIAL PRIMARY KEY,
  name  VARCHAR(48) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  meta  JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON puglit_metrics(name, created_at DESC);

-- ── Verified exemplars: known-good code (passed the gate) retrieved into prompts ──
CREATE TABLE IF NOT EXISTS verified_exemplars (
  id BIGSERIAL PRIMARY KEY,
  kind  VARCHAR(24) NOT NULL,   -- route | page
  task  TEXT,
  code  TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exemplars_kind ON verified_exemplars(kind, created_at DESC);

-- lesson outcome (anti-poisoning): only lessons from gate-passing builds get recalled
ALTER TABLE puglit_agent_diary ADD COLUMN IF NOT EXISTS outcome VARCHAR(12) DEFAULT 'unknown';
ALTER TABLE puglit_agent_diary ADD COLUMN IF NOT EXISTS scope VARCHAR(16) DEFAULT 'team';
