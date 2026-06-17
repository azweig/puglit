INSERT INTO notes (title, body, created_at, updated_at) VALUES
  ('Ejemplo', 'Texto de ejemplo', NOW(), NOW());

INSERT INTO reminders (note_id, reminder_time, is_completed) VALUES
  (1, NOW(), true);

INSERT INTO tags (name, color) VALUES
  ('Ejemplo', 'Ejemplo');