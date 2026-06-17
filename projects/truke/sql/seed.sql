INSERT INTO items (title, description, image_url, location, is_available) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'https://example.com', 'Ejemplo', true);

INSERT INTO matches (item_id, user_id_1, user_id_2, match_date) VALUES
  (1, 1, 1, NOW());

INSERT INTO chats (match_id, sender_id, message, timestamp) VALUES
  (1, 1, 'Texto de ejemplo', NOW());

INSERT INTO users (username, email, profile_picture, city) VALUES
  ('Ejemplo', 'demo@example.com', 'https://example.com', 'Ejemplo');