INSERT INTO members (name, email, join_date, status) VALUES
  ('Ejemplo', 'demo@example.com', CURRENT_DATE, 'a');

INSERT INTO reports (title, generated_date, data) VALUES
  ('Ejemplo', NOW(), 'Texto de ejemplo');

INSERT INTO predictions (member_id, predicted_date, likelihood) VALUES
  (1, CURRENT_DATE, 1.0);