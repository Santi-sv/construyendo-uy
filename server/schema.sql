CREATE TABLE IF NOT EXISTS cms_records (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS cms_records_expiry ON cms_records(expires_at);
