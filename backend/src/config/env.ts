import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_PRIVATE_KEY: z.string().min(1, "JWT_PRIVATE_KEY is required"),
  JWT_PUBLIC_KEY: z.string().min(1, "JWT_PUBLIC_KEY is required"),
  JWT_ISSUER: z.string().min(1, "JWT_ISSUER is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  SESSION_MAX_LIFETIME_DAYS: z.coerce.number().default(90),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().min(1, "FIREBASE_SERVICE_ACCOUNT_PATH is required"),
  AI_PROVIDER: z.enum(["gemini", "openrouter"]).default("gemini"),
  AI_MODEL: z.string().min(1, "AI_MODEL is required"),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  MAIL_PROVIDER: z.enum(["console"]).default("console"),
  ACCOUNT_DELETION_GRACE_DAYS: z.coerce.number().default(14),
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;