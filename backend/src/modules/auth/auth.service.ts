import { randomBytes } from "node:crypto";
import { sendEmail } from "../../lib/mailer/index.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/tokens.js";
import { generateRawRefreshToken, hashRefreshToken } from "../../lib/refreshTokens.js";
import { verifyGoogleIdToken } from "../../lib/googleAuth.js";
import { UnauthorizedError, ConflictError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import {
  createUser,
  findUserByEmail,
  savePasswordCredential,
  getPasswordHash,
  createSession,
  findActiveSessionById,
  revokeSession,
  saveRefreshToken,
  findRefreshTokenByHash,
  markRefreshTokenUsed,
  recordAuthEvent,
  findOauthIdentity,
  createOauthIdentity,
  markEmailVerified,
  createAuthToken,
  findValidAuthToken,
  markAuthTokenUsed,
  invalidateAuthTokensForUser,
  updatePasswordHash,
  revokeAllSessionsForUser,
  countRecentFailedLogins,
  markUserDeleted,
  findUserById,
} from "./auth.repository.js";

interface DeviceInfo {
  deviceName: string | null;
  userAgent: string | null;
  ip: string | null;
}

interface AuthResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;
const FAILED_LOGIN_WINDOW_MINUTES = 15;
const FAILED_LOGIN_LOCKOUT_THRESHOLD = 7;

function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

async function issueSessionTokens(userId: string, device: DeviceInfo): Promise<AuthResult> {
  const sessionExpiresAt = new Date(Date.now() + env.SESSION_MAX_LIFETIME_DAYS * DAY_MS);

  const session = await createSession(
    userId,
    device.deviceName,
    device.userAgent,
    device.ip,
    sessionExpiresAt
  );

  const rawRefreshToken = generateRawRefreshToken();
  const refreshTokenHash = hashRefreshToken(rawRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS);

  await saveRefreshToken(session.id, refreshTokenHash, refreshExpiresAt);

  const accessToken = await signAccessToken({ sub: userId, sid: session.id });

  return { userId, accessToken, refreshToken: rawRefreshToken };
}

export async function register(
  email: string,
  password: string,
  device: DeviceInfo
): Promise<AuthResult> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const user = await createUser(email);
  const passwordHash = await hashPassword(password);
  await savePasswordCredential(user.id, passwordHash);

  await recordAuthEvent(user.id, "register", email, device.ip, device.userAgent);

  return issueSessionTokens(user.id, device);
}

export async function login(
  email: string,
  password: string,
  device: DeviceInfo
): Promise<AuthResult> {
  const user = await findUserByEmail(email);

  if (!user) {

    await verifyPassword(
      "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      password
    );
    await recordAuthEvent(null, "login_failed", email, device.ip, device.userAgent);
    throw new UnauthorizedError();
  }

  if (user.status !== "active") {
    await recordAuthEvent(user.id, "login_blocked", email, device.ip, device.userAgent);
    throw new UnauthorizedError("Account is not active");
  }

  const recentFailures = await countRecentFailedLogins(email, FAILED_LOGIN_WINDOW_MINUTES);
  if (recentFailures >= FAILED_LOGIN_LOCKOUT_THRESHOLD) {
    await recordAuthEvent(user.id, "login_blocked_lockout", email, device.ip, device.userAgent);
    throw new UnauthorizedError("Too many failed attempts. Try again later.");
  }


  const passwordHash = await getPasswordHash(user.id);
  const isValid = passwordHash ? await verifyPassword(passwordHash, password) : false;

  if (!isValid) {
    await recordAuthEvent(user.id, "login_failed", email, device.ip, device.userAgent);
    throw new UnauthorizedError();
  }

  await recordAuthEvent(user.id, "login_success", email, device.ip, device.userAgent);

  return issueSessionTokens(user.id, device);
}

export async function refresh(rawRefreshToken: string): Promise<AuthResult> {

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const tokenRow = await findRefreshTokenByHash(tokenHash);

  if (!tokenRow) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (tokenRow.used_at) {
  
    await revokeSession(tokenRow.session_id, "refresh_reuse_detected");
    await recordAuthEvent(null, "refresh_reuse", null, null, null);
    throw new UnauthorizedError("Session revoked");
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  const session = await findActiveSessionById(tokenRow.session_id);
  if (!session) {
    throw new UnauthorizedError("Session no longer active");
  }

  await markRefreshTokenUsed(tokenRow.id);

  const rawNewRefreshToken = generateRawRefreshToken();
  const newTokenHash = hashRefreshToken(rawNewRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS);
  await saveRefreshToken(session.id, newTokenHash, refreshExpiresAt);

  const accessToken = await signAccessToken({ sub: session.user_id, sid: session.id });

  return { userId: session.user_id, accessToken, refreshToken: rawNewRefreshToken };
}

export async function loginWithGoogle(
  idToken: string,
  device: DeviceInfo
): Promise<AuthResult> {
  const googleUser = await verifyGoogleIdToken(idToken);

  const existingIdentity = await findOauthIdentity("google", googleUser.googleUserId);

  if (existingIdentity) {
    await recordAuthEvent(
      existingIdentity.user_id,
      "login_success_google",
      googleUser.email,
      device.ip,
      device.userAgent
    );
    return issueSessionTokens(existingIdentity.user_id, device);
  }

  const existingUser = await findUserByEmail(googleUser.email);

  if (existingUser) {

    await createOauthIdentity(existingUser.id, "google", googleUser.googleUserId, googleUser.email);

    if (googleUser.emailVerified) {
      await markEmailVerified(existingUser.id);
    }

    await recordAuthEvent(
      existingUser.id,
      "google_account_linked",
      googleUser.email,
      device.ip,
      device.userAgent
    );

    return issueSessionTokens(existingUser.id, device);
  }

  
  const newUser = await createUser(googleUser.email);
  await createOauthIdentity(newUser.id, "google", googleUser.googleUserId, googleUser.email);

  if (googleUser.emailVerified) {
    await markEmailVerified(newUser.id);
  }

  await recordAuthEvent(newUser.id, "register_google", googleUser.email, device.ip, device.userAgent);

  return issueSessionTokens(newUser.id, device);
}

export async function requestEmailVerification(userId: string, email: string): Promise<void> {
  await invalidateAuthTokensForUser(userId, "email_verification");

  const rawToken = generateRawToken();
  const tokenHash = hashRefreshToken(rawToken); // reusing the same SHA-256 hashing helper
  const expiresAt = new Date(Date.now() + HOUR_MS);

  await createAuthToken(userId, "email_verification", tokenHash, expiresAt);

  const verifyLink = `https://oppshunter.app/verify-email?token=${rawToken}`;
  await sendEmail(
    email,
    "Verify your OppsHunter email",
    `Click to verify your email: ${verifyLink}\n\nThis link expires in 1 hour.`
  );
}

export async function verifyEmail(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const tokenRow = await findValidAuthToken(tokenHash, "email_verification");

  if (!tokenRow) {
    throw new UnauthorizedError("Invalid or expired verification link");
  }

  await markAuthTokenUsed(tokenRow.id);
  await markEmailVerified(tokenRow.user_id);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);

  // Don't reveal whether the email exists — same enumeration protection as login.
  if (!user) return;

  await invalidateAuthTokensForUser(user.id, "password_reset");

  const rawToken = generateRawToken();
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + HOUR_MS);

  await createAuthToken(user.id, "password_reset", tokenHash, expiresAt);

  const resetLink = `https://oppshunter.app/reset-password?token=${rawToken}`;
  await sendEmail(
    email,
    "Reset your OppsHunter password",
    `Click to reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`
  );
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  const tokenRow = await findValidAuthToken(tokenHash, "password_reset");

  if (!tokenRow) {
    throw new UnauthorizedError("Invalid or expired reset link");
  }

  await markAuthTokenUsed(tokenRow.id);

  const newHash = await hashPassword(newPassword);
  await updatePasswordHash(tokenRow.user_id, newHash);

  // Resetting a password is a strong signal to kill every existing session —
  // if someone else had access, this locks them out immediately.
  await revokeAllSessionsForUser(tokenRow.user_id, null, "password_reset");
}

export async function logout(sessionId: string): Promise<void> {
  await revokeSession(sessionId, "user_logout");
}

export async function logoutAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
  await revokeAllSessionsForUser(userId, currentSessionId, "user_logout_all_others");
}

export async function deleteAccount(userId: string): Promise<void> {
  await markUserDeleted(userId);
  await revokeAllSessionsForUser(userId, null, "account_deleted");
}