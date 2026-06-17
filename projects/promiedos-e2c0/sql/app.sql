-- Promiedos — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS tournaments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  score_home INT DEFAULT 0,
  score_away INT DEFAULT 0,
  tournament_id INT REFERENCES tournaments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  team_name TEXT NOT NULL,
  points INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_scorers (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  goals INT DEFAULT 0,
  tournament_id INT REFERENCES tournaments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
