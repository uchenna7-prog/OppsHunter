-- Up Migration
ALTER TABLE auth_codes ADD COLUMN attempts integer NOT NULL DEFAULT 0;

-- Down Migration
ALTER TABLE auth_codes DROP COLUMN attempts;