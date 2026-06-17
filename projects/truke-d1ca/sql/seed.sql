INSERT INTO items (title, description, image_url, location, created_at) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'https://example.com', 'Ejemplo', NOW());

INSERT INTO matches (item_id, user_id, matched_at, is_active) VALUES
  (1, 1, NOW(), true);

INSERT INTO chats (match_id, message, sent_at, is_read) VALUES
  (1, 'Texto de ejemplo', NOW(), true);

INSERT INTO users (username, email, created_at, profile_picture) VALUES
  ('Ejemplo', 'demo@example.com', NOW(), 'https://example.com');