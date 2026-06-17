INSERT INTO books (title, author, isbn, available) VALUES
  ('Ejemplo', 'Ejemplo', 'Ejemplo', true);

INSERT INTO reservations (book_id, user_id, reservation_date, status) VALUES
  (1, 1, NOW(), 'a');

INSERT INTO notifications (reservation_id, notification_date, message, is_read) VALUES
  (1, NOW(), 'Texto de ejemplo', true);

INSERT INTO readinghistories (book_id, user_id, read_date, rating) VALUES
  (1, 1, CURRENT_DATE, 1);