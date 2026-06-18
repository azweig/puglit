INSERT INTO decks (name, archetype, format, is_active) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', true);

INSERT INTO simulations (title, scenario_type, starting_state, difficulty) VALUES
  ('Ejemplo', 'a', '{}'::jsonb, 'a');

INSERT INTO attempts (result, turns_taken, decision_log, completed_at) VALUES
  ('a', 1, 'Texto de ejemplo', NOW());

INSERT INTO packs (name, season, is_licensed, release_date) VALUES
  ('Ejemplo', 'Ejemplo', true, CURRENT_DATE);