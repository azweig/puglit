INSERT INTO items (title, description, image_url, created_at) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'https://example.com', NOW());

INSERT INTO matches (item_id, matched_user_id, matched_at) VALUES
  (1, 1, NOW());

INSERT INTO chats (match_id, message, sent_at) VALUES
  (1, 'Texto de ejemplo', NOW());