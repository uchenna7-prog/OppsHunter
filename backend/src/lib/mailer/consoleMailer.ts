import type { Mailer } from "./types.js";

export class ConsoleMailer implements Mailer {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log("\n--- EMAIL (dev mode, not actually sent) ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(body);
    console.log("--- END EMAIL ---\n");
  }
}