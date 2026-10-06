import { initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../config/env.js";

let app: App | undefined;

function getFirebaseApp(): App {
  if (!app) {
    app = initializeApp({
      credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    });
  }
  return app;
}

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messaging = getMessaging(getFirebaseApp());

  await messaging.send({
    token: deviceToken,
    notification: { title, body },
    data,
  });
}