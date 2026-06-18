INSERT INTO runs (score, duration_seconds, coins_collected, ended_at) VALUES
  (1, 1, 1, NOW());

INSERT INTO leaderboard_entries (player_name, score, rank, achieved_at) VALUES
  ('Ejemplo', 1, 1, NOW());

INSERT INTO unlocks (unlock_type, title, is_equipped, unlocked_at) VALUES
  ('a', 'Ejemplo', true, NOW());