-- Noteflow — bespoke app schema (run after the spine's 001/002/003).

CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  note_id BIGINT REFERENCES notes(id),
  reminder_time TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id BIGINT REFERENCES notes(id),
  tag_id BIGINT REFERENCES tags(id),
  PRIMARY KEY (note_id, tag_id)
);
