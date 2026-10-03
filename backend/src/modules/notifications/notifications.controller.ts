import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema,
  testNotificationSchema,
} from "./notifications.schemas.js";
import * as notificationsService from "./notifications.service.js";

export async function registerDeviceTokenHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = registerDeviceTokenSchema.parse(req.body);
    const result = await notificationsService.registerDeviceToken(
      req.userId!,
      input.token,
      input.platform
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function unregisterDeviceTokenHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = unregisterDeviceTokenSchema.parse(req.body);
    await notificationsService.unregisterDeviceToken(req.userId!, input.token);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function testNotificationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = testNotificationSchema.parse(req.body);
    await notificationsService.notifyUser(req.userId!, input.title, input.body);
    res.status(200).json({ sent: true });
  } catch (err) {
    next(err);
  }
}