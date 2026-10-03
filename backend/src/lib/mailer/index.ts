import { env } from "../../config/env.js";
import { ConsoleMailer } from "./consoleMailer.js";
import type { Mailer } from "./types.js";

let mailer: Mailer;

function getMailer(): Mailer {
  if (!mailer) {
    switch (env.MAIL_PROVIDER) {
      case "console":
        mailer = new ConsoleMailer();
        break;
      default:
        throw new Error(`Unsupported MAIL_PROVIDER: ${env.MAIL_PROVIDER}`);
    }
  }
  return mailer;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  return getMailer().send(to, subject, body);
}