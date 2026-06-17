-- Truke — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  owner_id INT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('new', 'like new', 'used', 'for parts')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swipes (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  item_id INT REFERENCES items(id),
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  user_a INT REFERENCES users(id),
  user_b INT REFERENCES users(id),
  item_a INT REFERENCES items(id),
  item_b INT REFERENCES items(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id),
  sender_id INT REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
