-- Reader reviews for murmmers.com. Nothing appears on the site until the
-- publisher approves it, so `approved` defaults to 0 and the read endpoint
-- only ever selects approved rows.
CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  book        TEXT    NOT NULL,          -- book slug
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  name        TEXT    NOT NULL,          -- display name, free text
  comment     TEXT    NOT NULL,
  approved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL,
  -- A salted hash, never the address itself: enough to rate limit, not enough
  -- to identify anyone if the database ever leaked.
  ip_hash     TEXT
);
CREATE INDEX IF NOT EXISTS reviews_book_approved ON reviews (book, approved, created_at);
CREATE INDEX IF NOT EXISTS reviews_iphash_time   ON reviews (ip_hash, created_at);
