INSERT INTO items (title, description, image_url, location) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'https://example.com', 'Ejemplo');

INSERT INTO matches (item_id, matched_user_id, match_date) VALUES
  (1, 1, NOW());

INSERT INTO chats (match_id, message, timestamp) VALUES
  (1, 'Texto de ejemplo', NOW());