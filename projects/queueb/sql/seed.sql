INSERT INTO queues (name, description, created_at, is_active) VALUES
  ('Ejemplo', 'Texto de ejemplo', NOW(), true);

INSERT INTO tasks (title, details, due_date, status) VALUES
  ('Ejemplo', 'Texto de ejemplo', CURRENT_DATE, 'a');

INSERT INTO users (email, full_name, joined_at) VALUES
  ('demo@example.com', 'Ejemplo', NOW());