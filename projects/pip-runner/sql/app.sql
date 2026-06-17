-- Pip Runner — leaderboard schema.
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  world INT NOT NULL,
  level INT NOT NULL,
  player VARCHAR(24) NOT NULL DEFAULT 'Pip',
  distance INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scores_distance ON scores(distance DESC);
