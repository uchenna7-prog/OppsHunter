import {
  upsertDeviceToken,
  removeDeviceToken,
  listDeviceTokensForUser,
  deleteDeviceTokenByValue,
} from "./notifications.repository.js";
import { sendPushNotification } from "../../lib/firebaseAdmin.js";

export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: "android" | "ios"
) {
  return upsertDeviceToken(userId, token, platform);
}

export async function unregisterDeviceToken(userId: string, token: string) {
  await removeDeviceToken(userId, token);
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const tokens = await listDeviceTokensForUser(userId);

  for (const deviceToken of tokens) {
    try {
      await sendPushNotification(deviceToken.token, title, body, data);
    } catch (err) {
      if (isInvalidTokenError(err)) {
        await deleteDeviceTokenByValue(deviceToken.token);
      } else {
        console.error("Failed to send push notification:", err);
      }
    }
  }
}

function isInvalidTokenError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
}