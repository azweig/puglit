-- Game highscores
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Anónimo' CHECK (char_length(trim(name)) BETWEEN 1 AND 24),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1000000),
  difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('easy','normal','hard','expert')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('easy','normal','hard','expert'));
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);
CREATE INDEX IF NOT EXISTS scores_difficulty_score_idx ON scores (difficulty, score DESC, created_at ASC);
