import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import {
  registerDeviceTokenHandler,
  unregisterDeviceTokenHandler,
  testNotificationHandler,
} from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.post("/device-tokens", registerDeviceTokenHandler);
notificationsRouter.delete("/device-tokens", unregisterDeviceTokenHandler);
notificationsRouter.post("/test", testNotificationHandler);