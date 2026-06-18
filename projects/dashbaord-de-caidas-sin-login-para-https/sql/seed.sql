INSERT INTO monitoredendpoints (name, url, check_interval_minutes, is_active) VALUES
  ('Ejemplo', 'https://example.com', 1, true);

INSERT INTO healthchecks (checked_at, status, http_status_code, response_time_ms, failure_reason) VALUES
  (NOW(), 'a', 1, 1, 'Ejemplo');

INSERT INTO alertevents (event_type, triggered_at, email_recipient, email_sent, message) VALUES
  ('a', NOW(), 'demo@example.com', true, 'Texto de ejemplo');