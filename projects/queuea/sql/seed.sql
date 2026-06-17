INSERT INTO queues (name, description, created_at) VALUES
  ('Ejemplo', 'Texto de ejemplo', NOW());

INSERT INTO tasks (title, status, due_date, queue_id) VALUES
  ('Ejemplo', 'a', CURRENT_DATE, 1);

INSERT INTO users (email, password_hash, created_at) VALUES
  ('demo@example.com', 'Ejemplo', NOW());