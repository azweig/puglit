CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  match_date TIMESTAMPTZ NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  score TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  points INTEGER NOT NULL,
  matches_played INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goalscorers (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  goals INTEGER NOT NULL,
  tournament_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);