-- DuelDeck — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) DEFAULT 'Anonymous',
  profile JSONB
);

CREATE TABLE IF NOT EXISTS decks (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cards JSONB
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  opponent_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(255) DEFAULT 'Pending',
  date TIMESTAMPTZ DEFAULT NOW(),
);

CREATE TABLE IF NOT EXISTS cards (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  atk INTEGER NOT NULL,
  def INTEGER NOT NULL,
  atributo ENUM('Fire','Water','Wind','Earth','Light','Dark') NOT NULL,
  tipo ENUM('Monster','Spell','Trap') NOT NULL,
  level INTEGER NOT NULL,
  image TEXT
);

CREATE TABLE IF NOT EXISTS card_images (
  id BIGSERIAL PRIMARY KEY,
  card_id INT REFERENCES cards(id) ON DELETE CASCADE,
  url TEXT NOT NULL
);
