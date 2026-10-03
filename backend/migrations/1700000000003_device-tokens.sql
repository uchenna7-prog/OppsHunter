-- Up Migration
CREATE TABLE device_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  platform   text NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_tokens_user_idx ON device_tokens(user_id);

-- Down Migration
DROP TABLE device_tokens;