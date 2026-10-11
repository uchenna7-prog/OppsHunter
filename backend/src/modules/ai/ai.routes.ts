import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../../lib/errors.js";
import { authenticate } from "../auth/auth.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { testPromptHandler } from "./ai.controller.js";

export const aiRouter = Router();

const rateLimitHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new TooManyRequestsError());
};

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthenticatedRequest).userId ?? "anonymous",
  handler: rateLimitHandler,
});

aiRouter.use(authenticate);
aiRouter.use(aiLimiter);

aiRouter.post("/test", testPromptHandler);