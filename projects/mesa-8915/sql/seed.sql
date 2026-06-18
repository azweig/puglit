INSERT INTO restaurants (name, phone, address, opening_hours) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', '{}'::jsonb);

INSERT INTO tables (restaurant_id, name, capacity, zone) VALUES
  ('Ejemplo', 'Ejemplo', 1, 'Ejemplo');

INSERT INTO reservations (restaurant_id, guest_name, guest_phone, guest_email, reservation_at) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', 'demo@example.com', NOW());

INSERT INTO shifts (restaurant_id, name, start_time, end_time, status) VALUES
  ('Ejemplo', 'Ejemplo', NOW(), NOW(), 'a');