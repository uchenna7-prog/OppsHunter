import { pool } from "../../db/pool.js";

export interface UserRow {
  id: string;
  email: string;
  email_verified_at: string | null;
  status: "active" | "suspended" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  device_name: string | null;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface RefreshTokenRow {
  id: string;
  session_id: string;
  token_hash: Buffer;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}


export interface AuthTokenRow {
  id: string;
  user_id: string;
  purpose: "email_verification" | "password_reset";
  token_hash: Buffer;
  expires_at: string;
  used_at: string | null;
}

export interface OauthIdentityRow {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  email: string | null;
  created_at: string;
}



export async function createUser(email: string): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email) VALUES ($1) RETURNING *`,
    [email]
  );
  return result.rows[0]!;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(userId: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function savePasswordCredential(
  userId: string,
  passwordHash: string
): Promise<void> {
  await pool.query(
    `INSERT INTO password_credentials (user_id, password_hash)
     VALUES ($1, $2)`,
    [userId, passwordHash]
  );
}

export async function getPasswordHash(userId: string): Promise<string | null> {
  const result = await pool.query<{ password_hash: string }>(
    `SELECT password_hash FROM password_credentials WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0]?.password_hash ?? null;
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await pool.query(
    `UPDATE password_credentials SET password_hash = $2, updated_at = now() WHERE user_id = $1`,
    [userId, passwordHash]
  );
}

export async function createSession(
  userId: string,
  deviceName: string | null,
  userAgent: string | null,
  ip: string | null,
  expiresAt: Date
): Promise<SessionRow> {
  const result = await pool.query<SessionRow>(
    `INSERT INTO sessions (user_id, device_name, user_agent, ip, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, deviceName, userAgent, ip, expiresAt]
  );
  return result.rows[0]!;
}

export async function findActiveSessionById(sessionId: string): Promise<SessionRow | null> {
  const result = await pool.query<SessionRow>(
    `SELECT * FROM sessions
     WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [sessionId]
  );
  return result.rows[0] ?? null;
}

export async function revokeSession(sessionId: string, reason: string): Promise<void> {
  await pool.query(
    `UPDATE sessions SET revoked_at = now(), revoked_reason = $2 WHERE id = $1`,
    [sessionId, reason]
  );
}

export async function saveRefreshToken(
  sessionId: string,
  tokenHash: Buffer,
  expiresAt: Date
): Promise<void> {
  await pool.query(
    `INSERT INTO refresh_tokens (session_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [sessionId, tokenHash, expiresAt]
  );
}

export async function findRefreshTokenByHash(
  tokenHash: Buffer
): Promise<RefreshTokenRow | null> {
  const result = await pool.query<RefreshTokenRow>(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function markRefreshTokenUsed(tokenId: string): Promise<void> {
  await pool.query(`UPDATE refresh_tokens SET used_at = now() WHERE id = $1`, [tokenId]);
}

export async function recordAuthEvent(
  userId: string | null,
  eventType: string,
  identifier: string | null,
  ip: string | null,
  userAgent: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO auth_events (user_id, event_type, identifier, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, eventType, identifier, ip, userAgent]
  );
}

export async function findOauthIdentity(
  provider: string,
  providerUserId: string
): Promise<OauthIdentityRow | null> {
  const result = await pool.query<OauthIdentityRow>(
    `SELECT * FROM oauth_identities WHERE provider = $1 AND provider_user_id = $2`,
    [provider, providerUserId]
  );
  return result.rows[0] ?? null;
}

export async function createOauthIdentity(
  userId: string,
  provider: string,
  providerUserId: string,
  email: string
): Promise<OauthIdentityRow> {
  const result = await pool.query<OauthIdentityRow>(
    `INSERT INTO oauth_identities (user_id, provider, provider_user_id, email)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, provider, providerUserId, email]
  );
  return result.rows[0]!;
}

export async function markEmailVerified(userId: string): Promise<void> {
  await pool.query(
    `UPDATE users SET email_verified_at = now() WHERE id = $1 AND email_verified_at IS NULL`,
    [userId]
  );
}

export async function createAuthToken(
  userId: string,
  purpose: "email_verification" | "password_reset",
  tokenHash: Buffer,
  expiresAt: Date
): Promise<AuthTokenRow> {
  const result = await pool.query<AuthTokenRow>(
    `INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, purpose, tokenHash, expiresAt]
  );
  return result.rows[0]!;
}

export async function findValidAuthToken(
  tokenHash: Buffer,
  purpose: "email_verification" | "password_reset"
): Promise<AuthTokenRow | null> {
  const result = await pool.query<AuthTokenRow>(
    `SELECT * FROM auth_tokens
     WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash, purpose]
  );
  return result.rows[0] ?? null;
}

export async function markAuthTokenUsed(tokenId: string): Promise<void> {
  await pool.query(`UPDATE auth_tokens SET used_at = now() WHERE id = $1`, [tokenId]);
}

export async function invalidateAuthTokensForUser(
  userId: string,
  purpose: "email_verification" | "password_reset"
): Promise<void> {
  await pool.query(
    `UPDATE auth_tokens SET used_at = now()
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`,
    [userId, purpose]
  );
}

export async function revokeAllSessionsForUser(
  userId: string,
  exceptSessionId: string | null,
  reason: string
): Promise<void> {
  if (exceptSessionId) {
    await pool.query(
      `UPDATE sessions SET revoked_at = now(), revoked_reason = $3
       WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL`,
      [userId, exceptSessionId, reason]
    );
  } else {
    await pool.query(
      `UPDATE sessions SET revoked_at = now(), revoked_reason = $2
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId, reason]
    );
  }
}

export async function countRecentFailedLogins(identifier: string, minutes: number): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM auth_events
     WHERE identifier = $1 AND event_type = 'login_failed' AND created_at > now() - ($2 || ' minutes')::interval`,
    [identifier, minutes]
  );
  return parseInt(result.rows[0]!.count, 10);
}

export async function deleteExpiredAuthData(): Promise<{
  refreshTokens: number;
  authTokens: number;
  sessions: number;
}> {
  const refreshResult = await pool.query(
    `DELETE FROM refresh_tokens WHERE expires_at < now()`
  );
  const authTokensResult = await pool.query(
    `DELETE FROM auth_tokens WHERE expires_at < now()`
  );
  const sessionsResult = await pool.query(
    `DELETE FROM sessions WHERE expires_at < now() OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '7 days')`
  );

  return {
    refreshTokens: refreshResult.rowCount ?? 0,
    authTokens: authTokensResult.rowCount ?? 0,
    sessions: sessionsResult.rowCount ?? 0,
  };
}

export async function markUserDeleted(userId: string): Promise<void> {
  await pool.query(`UPDATE users SET status = 'deleted' WHERE id = $1`, [userId]);
}