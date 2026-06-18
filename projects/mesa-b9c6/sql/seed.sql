INSERT INTO restaurants (name, phone, address, timezone) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', 'Ejemplo');

INSERT INTO tables (label, capacity, area, is_active) VALUES
  ('Ejemplo', 1, 'Ejemplo', true);

INSERT INTO reservations (guest_name, guest_phone, guest_email, party_size, reserved_at) VALUES
  ('Ejemplo', 'Ejemplo', 'demo@example.com', 1, NOW());

INSERT INTO shifts (name, service_date, start_time, end_time, status) VALUES
  ('Ejemplo', CURRENT_DATE, NOW(), NOW(), 'a');