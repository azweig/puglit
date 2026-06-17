INSERT INTO items (title, description, image_url, condition) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'https://example.com', 'a');

INSERT INTO matches (item_id, user_id, matched_at) VALUES
  (1, 1, NOW());

INSERT INTO chats (match_id, message, sent_at) VALUES
  (1, 'Texto de ejemplo', NOW());