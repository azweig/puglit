-- Promiedos — deep schema (API-Football shaped). Run after the spine's 001/002/003.
-- Data is INGESTED from API-Football (or the bundled mock) by app/api/cron/refresh.

CREATE TABLE IF NOT EXISTS tournaments (
  id BIGSERIAL PRIMARY KEY,
  api_id INT UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  flag TEXT,
  logo TEXT,
  season TEXT,
  current_round INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  api_id INT UNIQUE,
  tournament_id INT REFERENCES tournaments(id),
  date TIMESTAMPTZ NOT NULL,
  round TEXT,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  home_logo TEXT,
  away_logo TEXT,
  score_home INT DEFAULT 0,
  score_away INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled | live | finished
  minute INT,                                -- elapsed minutes when live
  venue TEXT,
  referee TEXT
);

CREATE TABLE IF NOT EXISTS match_events (
  id BIGSERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  minute INT,
  extra INT,
  team_name TEXT,
  player_name TEXT,
  assist_name TEXT,
  type TEXT,     -- Goal | Card | subst | Var
  detail TEXT
);

CREATE TABLE IF NOT EXISTS lineups (
  id BIGSERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  team_name TEXT,
  formation TEXT,
  player_name TEXT,
  number INT,
  pos TEXT,      -- G | D | M | F
  grid TEXT,     -- "row:col" for the pitch graphic
  is_starter BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS match_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  team_name TEXT,
  stat_type TEXT,
  stat_value TEXT
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  rank INT,
  team_name TEXT NOT NULL,
  team_logo TEXT,
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
CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_lineups_match ON lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_stats_match ON match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_standings_tournament ON standings(tournament_id);
