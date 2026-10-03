-- Up Migration
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');

CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext NOT NULL UNIQUE,
  email_verified_at timestamptz,
  status            user_status NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE password_credentials (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE oauth_identities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         text NOT NULL CHECK (provider IN ('google')),
  provider_user_id text NOT NULL,
  email            citext,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX oauth_identities_user_id_idx ON oauth_identities(user_id);

CREATE TABLE sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name    text,
  user_agent     text,
  ip             inet,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_used_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz,
  revoked_reason text
);
CREATE INDEX sessions_user_active_idx ON sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);
CREATE INDEX refresh_tokens_session_idx ON refresh_tokens(session_id);

CREATE TYPE auth_token_purpose AS ENUM ('email_verification', 'password_reset');

CREATE TABLE auth_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    auth_token_purpose NOT NULL,
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);
CREATE INDEX auth_tokens_user_purpose_idx ON auth_tokens(user_id, purpose);

CREATE TABLE auth_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  identifier text,
  ip         inet,
  user_agent text,
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_events_type_time_idx ON auth_events(event_type, created_at DESC);
CREATE INDEX auth_events_ip_time_idx ON auth_events(ip, created_at DESC);
CREATE INDEX auth_events_identifier_time_idx ON auth_events(identifier, created_at DESC);

-- Down Migration
DROP TABLE auth_events, auth_tokens, refresh_tokens, sessions, oauth_identities, password_credentials, users;
DROP TYPE auth_token_purpose, user_status;
DROP FUNCTION set_updated_at();