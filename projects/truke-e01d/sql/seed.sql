INSERT INTO items (title, description, condition, location, image_url) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'a', 'Ejemplo', 'https://example.com');

INSERT INTO matches (item_id, user_id, matched_at, is_active) VALUES
  (1, 1, NOW(), true);

INSERT INTO chats (match_id, message, sent_at, is_read) VALUES
  (1, 'Texto de ejemplo', NOW(), true);

INSERT INTO users (username, email, profile_picture, created_at) VALUES
  ('Ejemplo', 'demo@example.com', 'https://example.com', NOW());