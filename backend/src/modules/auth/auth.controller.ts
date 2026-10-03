import type { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  googleLoginSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";
import * as authService from "./auth.service.js";
import { findUserById } from "./auth.repository.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

function getDeviceInfo(req: Request, deviceName?: string) {
  return {
    deviceName: deviceName ?? null,
    userAgent: req.get("user-agent") ?? null,
    ip: req.ip ?? null,
  };
}

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const device = getDeviceInfo(req, input.deviceName);

    const result = await authService.register(input.email, input.password, device);

    res.status(201).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const device = getDeviceInfo(req, input.deviceName);

    const result = await authService.login(input.email, input.password, device);

    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function googleLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = googleLoginSchema.parse(req.body);
    const device = getDeviceInfo(req, input.deviceName);

    const result = await authService.loginWithGoogle(input.idToken, device);

    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = refreshSchema.parse(req.body);

    const result = await authService.refresh(input.refreshToken);

    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await authService.logout(req.sessionId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function logoutAllOtherSessionsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await authService.logoutAllOtherSessions(req.userId!, req.sessionId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function meHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    res.status(200).json({ userId: req.userId, sessionId: req.sessionId });
  } catch (err) {
    next(err);
  }
}

export async function requestEmailVerificationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await findUserById(req.userId!);
    if (!user) throw new Error("User not found");
    await authService.requestEmailVerification(user.id, user.email);
    res.status(200).json({ sent: true });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(input.token);
    res.status(200).json({ verified: true });
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordResetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = requestPasswordResetSchema.parse(req.body);
    await authService.requestPasswordReset(input.email);
    res.status(200).json({ sent: true });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input.token, input.newPassword);
    res.status(200).json({ reset: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccountHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await authService.deleteAccount(req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}