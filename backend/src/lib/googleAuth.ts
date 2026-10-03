import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUER = ["https://accounts.google.com", "accounts.google.com"];

const googleJWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface GoogleUserInfo {
  googleUserId: string;
  email: string;
  emailVerified: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  let payload;

  try {
    const result = await jwtVerify(idToken, googleJWKS, {
      issuer: GOOGLE_ISSUER,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = result.payload;
  } catch {
    throw new UnauthorizedError("Invalid Google token");
  }

  const email = payload.email as string | undefined;
  const emailVerified = payload.email_verified as boolean | undefined;

  if (!email) {
    throw new UnauthorizedError("Google token did not include an email");
  }

  return {
    googleUserId: payload.sub as string,
    email,
    emailVerified: emailVerified ?? false,
  };
}