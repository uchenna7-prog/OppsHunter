import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { TooManyRequestsError } from "../lib/errors.js";
import type { AuthenticatedRequest } from "./authenticate.js";

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  perUser?: boolean;
}

export function createRateLimiter({ windowMs, limit, perUser = false }: RateLimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(perUser
      ? { keyGenerator: (req: Request) => (req as AuthenticatedRequest).userId ?? "anonymous" }
      : {}),
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  });
}