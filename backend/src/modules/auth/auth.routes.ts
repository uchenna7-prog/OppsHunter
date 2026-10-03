import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  googleLoginHandler,
  logoutHandler,
  meHandler,
  requestEmailVerificationHandler,
  verifyEmailHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
  logoutAllOtherSessionsHandler,
  deleteAccountHandler,
} from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { TooManyRequestsError } from "../../lib/errors.js";

const rateLimitHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new TooManyRequestsError());
};

export const authRouter = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

authRouter.post("/register", registerLimiter, registerHandler);
authRouter.post("/login", loginLimiter, loginHandler);
authRouter.post("/refresh", refreshLimiter, refreshHandler);
authRouter.post("/google", loginLimiter, googleLoginHandler);
authRouter.post("/logout", authenticate, logoutHandler);
authRouter.post("/verify-email/request", authenticate, requestEmailVerificationHandler);
authRouter.post("/verify-email", verifyEmailHandler);
authRouter.post("/password-reset/request", resetLimiter, requestPasswordResetHandler);
authRouter.post("/password-reset", resetLimiter, resetPasswordHandler);
authRouter.post("/logout-all-others", authenticate, logoutAllOtherSessionsHandler);
authRouter.delete("/me", authenticate, deleteAccountHandler);
authRouter.get("/me", authenticate, meHandler);