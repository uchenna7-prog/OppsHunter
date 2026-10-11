-- Up Migration
ALTER TYPE auth_token_purpose RENAME TO auth_code_purpose;
ALTER TABLE auth_tokens RENAME TO auth_codes;
ALTER TABLE auth_codes RENAME COLUMN token_hash TO code_hash;
ALTER TABLE auth_codes RENAME CONSTRAINT auth_tokens_pkey TO auth_codes_pkey;
ALTER TABLE auth_codes RENAME CONSTRAINT auth_tokens_token_hash_key TO auth_codes_code_hash_key;
ALTER TABLE auth_codes RENAME CONSTRAINT auth_tokens_user_id_fkey TO auth_codes_user_id_fkey;
ALTER INDEX auth_tokens_user_purpose_idx RENAME TO auth_codes_user_purpose_idx;

-- Down Migration
ALTER INDEX auth_codes_user_purpose_idx RENAME TO auth_tokens_user_purpose_idx;
ALTER TABLE auth_codes RENAME CONSTRAINT auth_codes_user_id_fkey TO auth_tokens_user_id_fkey;
ALTER TABLE auth_codes RENAME CONSTRAINT auth_codes_code_hash_key TO auth_tokens_token_hash_key;
ALTER TABLE auth_codes RENAME CONSTRAINT auth_codes_pkey TO auth_tokens_pkey;
ALTER TABLE auth_codes RENAME COLUMN code_hash TO token_hash;
ALTER TABLE auth_codes RENAME TO auth_tokens;
ALTER TYPE auth_code_purpose RENAME TO auth_token_purpose;