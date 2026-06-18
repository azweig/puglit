-- Game scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  chapter TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Normal' CONSTRAINT scenarios_difficulty_check CHECK (difficulty IN ('Easy', 'Normal', 'Hard')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO scenarios (id, title, chapter, difficulty)
VALUES
  ('legacy', 'Legacy', 'Legacy', 'Normal')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS scenarios_chapter_idx ON scenarios (chapter);
CREATE INDEX IF NOT EXISTS scenarios_difficulty_idx ON scenarios (difficulty);

-- Game highscores
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Anónimo',
  score INTEGER NOT NULL DEFAULT 0,
  scenario_id TEXT NOT NULL DEFAULT 'legacy' REFERENCES scenarios(id),
  difficulty TEXT NOT NULL DEFAULT 'Normal' CONSTRAINT scores_difficulty_check CHECK (difficulty IN ('Easy', 'Normal', 'Hard')),
  chapter TEXT,
  success BOOLEAN,
  elapsed_ms INTEGER,
  attempts INTEGER,
  hints_used INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scores ADD COLUMN IF NOT EXISTS scenario_id TEXT DEFAULT 'legacy';
UPDATE scores SET scenario_id = 'legacy' WHERE scenario_id IS NULL;
ALTER TABLE scores ALTER COLUMN scenario_id SET DEFAULT 'legacy';
ALTER TABLE scores ALTER COLUMN scenario_id SET NOT NULL;

ALTER TABLE scores ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Normal';
UPDATE scores SET difficulty = 'Normal' WHERE difficulty IS NULL OR difficulty NOT IN ('Easy', 'Normal', 'Hard');
ALTER TABLE scores ALTER COLUMN difficulty SET DEFAULT 'Normal';
ALTER TABLE scores ALTER COLUMN difficulty SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scores_difficulty_check'
      AND conrelid = 'scores'::regclass
  ) THEN
    ALTER TABLE scores ADD CONSTRAINT scores_difficulty_check CHECK (difficulty IN ('Easy', 'Normal', 'Hard'));
  END IF;
END $$;

ALTER TABLE scores ADD COLUMN IF NOT EXISTS chapter TEXT;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS success BOOLEAN;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS elapsed_ms INTEGER;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS attempts INTEGER;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS hints_used INTEGER;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

INSERT INTO scenarios (id, title, chapter, difficulty)
SELECT DISTINCT
  scenario_id,
  scenario_id,
  chapter,
  CASE WHEN difficulty IN ('Easy', 'Normal', 'Hard') THEN difficulty ELSE 'Normal' END
FROM scores
WHERE scenario_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scores_scenario_id_fkey'
      AND conrelid = 'scores'::regclass
  ) THEN
    ALTER TABLE scores ADD CONSTRAINT scores_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES scenarios(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
CREATE INDEX IF NOT EXISTS scores_scope_score_idx ON scores (scenario_id, difficulty, score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores (created_at DESC);
CREATE INDEX IF NOT EXISTS scores_scenario_difficulty_idx ON scores (scenario_id, difficulty);

-- Funnel analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  scenario_id TEXT,
  difficulty TEXT,
  chapter TEXT,
  success BOOLEAN,
  elapsed_ms INTEGER,
  attempts INTEGER,
  hints_used INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS analytics_events_scenario_id_idx ON analytics_events (scenario_id);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);
