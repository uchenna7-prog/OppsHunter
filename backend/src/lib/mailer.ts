import { env } from "../config/env.js";
import { AppError } from "./errors.js";

const SEND_FAILED_MESSAGE = "Couldn't send the email. Please try again.";

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (env.MAIL_PROVIDER === "console") {
    console.log("\n--- EMAIL (dev mode, not actually sent) ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(body);
    console.log("--- END EMAIL ---\n");
    return;
  }

  const { RESEND_API_KEY, MAIL_FROM } = env;

  if (!RESEND_API_KEY || !MAIL_FROM) {
    throw new AppError(500, "MAIL_NOT_CONFIGURED", "Email sending is not configured");
  }

  let response: Response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [to],
        subject,
        text: body,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("Resend request error:", err);
    throw new AppError(502, "EMAIL_SEND_FAILED", SEND_FAILED_MESSAGE);
  }

  if (!response.ok) {
    console.error(`Resend rejected the email (${response.status}):`, await response.text());
    throw new AppError(502, "EMAIL_SEND_FAILED", SEND_FAILED_MESSAGE);
  }
}