INSERT INTO links (original_url, shortened_url, created_at, click_count) VALUES
  ('https://example.com', 'https://example.com', NOW(), 1);

INSERT INTO clicks (link_id, clicked_at, referrer, user_agent) VALUES
  (1, NOW(), 'Ejemplo', 'Ejemplo');

INSERT INTO qrcodes (link_id, generated_at, size) VALUES
  (1, NOW(), 'a');