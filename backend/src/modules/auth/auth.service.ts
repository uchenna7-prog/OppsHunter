import { createHash, randomInt } from "node:crypto";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/tokens.js";
import { generateRawRefreshToken, hashRefreshToken } from "../../lib/refreshTokens.js";
import { verifyGoogleIdToken } from "../../lib/googleAuth.js";
import { sendEmail } from "../../lib/mailer/index.js";
import { UnauthorizedError, ConflictError, TooManyRequestsError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import {
  createUser,
  findUserByEmail,
  savePasswordCredential,
  getPasswordHash,
  updatePasswordHash,
  createSession,
  findActiveSessionById,
  revokeSession,
  revokeAllSessionsForUser,
  saveRefreshToken,
  findRefreshTokenByHash,
  markRefreshTokenUsed,
  findOauthIdentity,
  createOauthIdentity,
  markEmailVerified,
  createAuthToken,
  findValidAuthToken,
  markAuthTokenUsed,
  invalidateAuthTokensForUser,
  countRecentFailedLogins,
  countRecentAuthEvents,
  markUserPendingDeletion,
  recordAuthEvent,
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

type CodePurpose = "email_verification" | "password_reset";

const DAY_MS = 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 15 * 60 * 1000;
const CODE_ATTEMPT_WINDOW_MINUTES = 15;
const CODE_MAX_ATTEMPTS = 5;
const FAILED_LOGIN_WINDOW_MINUTES = 15;
const FAILED_LOGIN_LOCKOUT_THRESHOLD = 7;

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashCode(userId: string, purpose: CodePurpose, code: string): Buffer {
  return createHash("sha256").update(`${userId}:${purpose}:${code}`).digest();
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

export async function logout(sessionId: string): Promise<void> {
  await revokeSession(sessionId, "user_logout");
}

export async function logoutAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
  await revokeAllSessionsForUser(userId, currentSessionId, "user_logout_all_others");
}

export async function requestEmailVerification(userId: string, email: string): Promise<void> {
  await invalidateAuthTokensForUser(userId, "email_verification");

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await createAuthToken(
    userId,
    "email_verification",
    hashCode(userId, "email_verification", code),
    expiresAt
  );

  await sendEmail(
    email,
    "Your OppsHunter verification code",
    `Your verification code is ${code}\n\nIt expires in 15 minutes. If you didn't create an account, ignore this email.`
  );
}

export async function verifyEmail(userId: string, code: string, device: DeviceInfo): Promise<void> {
  const identifier = `verify:${userId}`;

  const failures = await countRecentAuthEvents(
    identifier,
    "verify_email_failed",
    CODE_ATTEMPT_WINDOW_MINUTES
  );
  if (failures >= CODE_MAX_ATTEMPTS) {
    throw new TooManyRequestsError("Too many incorrect attempts. Try again in 15 minutes.");
  }

  const tokenRow = await findValidAuthToken(
    hashCode(userId, "email_verification", code),
    "email_verification"
  );

  if (!tokenRow) {
    await recordAuthEvent(userId, "verify_email_failed", identifier, device.ip, device.userAgent);
    throw new UnauthorizedError("Invalid or expired code");
  }

  await markAuthTokenUsed(tokenRow.id);
  await markEmailVerified(userId);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);

  if (!user) return;

  await invalidateAuthTokensForUser(user.id, "password_reset");

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await createAuthToken(user.id, "password_reset", hashCode(user.id, "password_reset", code), expiresAt);

  await sendEmail(
    email,
    "Your OppsHunter password reset code",
    `Your password reset code is ${code}\n\nIt expires in 15 minutes. If you didn't request this, ignore this email.`
  );
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  device: DeviceInfo
): Promise<void> {
  const identifier = `reset:${email}`;

  const failures = await countRecentAuthEvents(
    identifier,
    "password_reset_failed",
    CODE_ATTEMPT_WINDOW_MINUTES
  );
  if (failures >= CODE_MAX_ATTEMPTS) {
    throw new TooManyRequestsError("Too many incorrect attempts. Try again in 15 minutes.");
  }

  const user = await findUserByEmail(email);
  const tokenRow = user
    ? await findValidAuthToken(hashCode(user.id, "password_reset", code), "password_reset")
    : null;

  if (!user || !tokenRow) {
    await recordAuthEvent(
      user?.id ?? null,
      "password_reset_failed",
      identifier,
      device.ip,
      device.userAgent
    );
    throw new UnauthorizedError("Invalid or expired code");
  }

  await markAuthTokenUsed(tokenRow.id);

  const newHash = await hashPassword(newPassword);
  await updatePasswordHash(user.id, newHash);

  await revokeAllSessionsForUser(user.id, null, "password_reset");
}

export async function deleteAccount(userId: string): Promise<void> {
  await markUserPendingDeletion(userId);
  await revokeAllSessionsForUser(userId, null, "account_deletion_requested");
}