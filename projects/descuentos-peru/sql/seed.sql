INSERT INTO loyaltyprograms (name, provider, membership_id, expiration_date) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', CURRENT_DATE);

INSERT INTO discounts (description, amount, valid_until, location) VALUES
  ('Texto de ejemplo', 1.0, CURRENT_DATE, 'Ejemplo');

INSERT INTO userlocations (latitude, longitude, address) VALUES
  (1.0, 1.0, 'Ejemplo');