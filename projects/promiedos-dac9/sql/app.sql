-- Promiedos — bespoke app schema (multi-country). Run after the spine's 001/002/003.

CREATE TABLE IF NOT EXISTS tournaments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  flag TEXT,                       -- emoji flag for the UI
  season TEXT,
  current_round INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  date TIMESTAMPTZ NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  score_home INT DEFAULT 0,
  score_away INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled'  -- scheduled | live | finished
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  team_name TEXT NOT NULL,
  points INT DEFAULT 0,
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  drawn INT DEFAULT 0,
  lost INT DEFAULT 0,
  gf INT DEFAULT 0,
  ga INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS goal_scorers (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  player_name TEXT NOT NULL,
  team_name TEXT,
  goals INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_standings_tournament ON standings(tournament_id);
