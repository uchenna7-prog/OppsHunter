import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";
import { env } from "../config/env.js";

const ALG = "EdDSA";

function normalizePem(value: string): string {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");
}

async function getPrivateKey() {
  return importPKCS8(normalizePem(env.JWT_PRIVATE_KEY), ALG);
}

async function getPublicKey() {
  return importSPKI(normalizePem(env.JWT_PUBLIC_KEY), ALG);
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const privateKey = await getPrivateKey();

  return new SignJWT({ sid: payload.sid })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const publicKey = await getPublicKey();

  const { payload } = await jwtVerify(token, publicKey, {
    issuer: env.JWT_ISSUER,
  });

  return {
    sub: payload.sub as string,
    sid: payload.sid as string,
  };
}