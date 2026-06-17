INSERT INTO queues (queue_name, created_at, status) VALUES
  ('Ejemplo', NOW(), 'a');

INSERT INTO tasks (task_name, description, due_date, priority) VALUES
  ('Ejemplo', 'Texto de ejemplo', CURRENT_DATE, 'a');

INSERT INTO users (email, full_name, joined_at) VALUES
  ('demo@example.com', 'Ejemplo', NOW());