-- Promiedos — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  date_time TIMESTAMPTZ NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  score_home INT,
  score_away INT
);

CREATE TABLE IF NOT EXISTS tournaments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_stage TEXT
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  team_name TEXT NOT NULL,
  points INT NOT NULL,
  matches_played INT NOT NULL,
  goal_difference INT NOT NULL
);

CREATE TABLE IF NOT EXISTS scorers (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  goals INT NOT NULL,
  tournament_id INT REFERENCES tournaments(id)
);
