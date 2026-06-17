INSERT INTO items (title, description, image_url, condition) VALUES
  ('Ejemplo', 'Texto de ejemplo', 'https://example.com', 'a');

INSERT INTO matches (item_id, user_id, matched_at, is_active) VALUES
  (1, 1, NOW(), true);

INSERT INTO chats (match_id, message, sent_at, is_sender) VALUES
  (1, 'Texto de ejemplo', NOW(), true);