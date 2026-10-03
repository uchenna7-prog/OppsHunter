import { initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "node:fs";
import { env } from "../config/env.js";

let app: App;

function getFirebaseApp(): App {
  if (!app) {
    const serviceAccount = JSON.parse(
      readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
    );

    app = initializeApp({
      credential: cert(serviceAccount),
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