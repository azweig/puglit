-- Promiedos — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  date_time TIMESTAMPTZ NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  score_home INT DEFAULT 0,
  score_away INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leagues (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  season TEXT NOT NULL,
  current_round INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  goals INT DEFAULT 0,
  position TEXT CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixtures (
  id BIGSERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id),
  date DATE NOT NULL,
  league_id INT REFERENCES leagues(id),
  status TEXT CHECK (status IN ('Scheduled', 'Ongoing', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
