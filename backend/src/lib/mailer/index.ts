import { env } from "../../config/env.js";
import { ConsoleMailer } from "./consoleMailer.js";
import { ResendMailer } from "./resendMailer.js";
import type { Mailer } from "./types.js";

let mailer: Mailer;

function getMailer(): Mailer {
  if (!mailer) {
    switch (env.MAIL_PROVIDER) {
      case "console":
        mailer = new ConsoleMailer();
        break;
      case "resend":
        if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
          throw new Error("RESEND_API_KEY and MAIL_FROM are required when MAIL_PROVIDER=resend");
        }
        mailer = new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
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