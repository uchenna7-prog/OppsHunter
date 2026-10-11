import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
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
  verifyResetCodeHandler,
  resetPasswordHandler,
  deleteAccountHandler,
} from "./auth.controller.js";

export const authRouter = Router();

const registerLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 5 });
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });
const refreshLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 30 });
const resetRequestLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 5 });
const resetConfirmLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });
const verificationRequestLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 6 });

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
authRouter.post("/password-reset/verify", resetConfirmLimiter, verifyResetCodeHandler);
authRouter.post("/password-reset", resetConfirmLimiter, resetPasswordHandler);
authRouter.delete("/me", authenticate, deleteAccountHandler);