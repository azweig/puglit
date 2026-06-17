-- Promiedos — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS tournaments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT CHECK (type IN ('league', 'cup', 'friendly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  match_date TIMESTAMPTZ NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  score TEXT,
  tournament_id BIGINT REFERENCES tournaments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id),
  team_name TEXT NOT NULL,
  points INT NOT NULL,
  matches_played INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_scorers (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  goals INT NOT NULL,
  tournament_id BIGINT REFERENCES tournaments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
