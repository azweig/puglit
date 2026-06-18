INSERT INTO restaurants (name, phone, address, opening_hours) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', '{}'::jsonb);

INSERT INTO tables (restaurant_id, name, capacity, status) VALUES
  ('Ejemplo', 'Ejemplo', 1, 'a');

INSERT INTO reservations (restaurant_id, customer_name, customer_phone, party_size, reserved_at) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', 1, NOW());

INSERT INTO shifts (restaurant_id, name, start_time, end_time, is_active) VALUES
  ('Ejemplo', 'Ejemplo', NOW(), NOW(), true);