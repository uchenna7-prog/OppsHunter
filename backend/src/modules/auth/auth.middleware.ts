import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../lib/tokens.js";
import { UnauthorizedError } from "../../lib/errors.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new UnauthorizedError("Missing access token");
    }

    const payload = await verifyAccessToken(token);

    req.userId = payload.sub;
    req.sessionId = payload.sid;

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}