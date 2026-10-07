import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../../lib/errors.js";
import {
  registerHandler,
  loginHandler,
  googleLoginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllOtherSessionsHandler,
  meHandler,
  requestEmailVerificationHandler,
  verifyEmailHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
  deleteAccountHandler,
} from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";

export const authRouter = Router();

const rateLimitHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new TooManyRequestsError());
};

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const resetConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const verificationRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

authRouter.post("/register", registerLimiter, registerHandler);
authRouter.post("/login", loginLimiter, loginHandler);
authRouter.post("/google", loginLimiter, googleLoginHandler);
authRouter.post("/refresh", refreshLimiter, refreshHandler);
authRouter.post("/logout", authenticate, logoutHandler);
authRouter.post("/logout-all-others", authenticate, logoutAllOtherSessionsHandler);
authRouter.get("/me", authenticate, meHandler);

authRouter.post(
  "/verify-email/request",
  authenticate,
  verificationRequestLimiter,
  requestEmailVerificationHandler
);
authRouter.post("/verify-email", authenticate, verifyEmailHandler);
authRouter.post("/password-reset/request", resetRequestLimiter, requestPasswordResetHandler);
authRouter.post("/password-reset", resetConfirmLimiter, resetPasswordHandler);
authRouter.delete("/me", authenticate, deleteAccountHandler);