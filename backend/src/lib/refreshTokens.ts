import { randomBytes, createHash } from "node:crypto";

const RAW_TOKEN_BYTES = 32;

export function generateRawRefreshToken(): string {
  return randomBytes(RAW_TOKEN_BYTES).toString("base64url");
}

export function hashRefreshToken(rawToken: string): Buffer {
  return createHash("sha256").update(rawToken).digest();
}