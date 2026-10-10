import type { Mailer } from "./types.js";

export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject,
        text: body,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Resend request failed (${response.status}): ${detail}`);
    }
  }
}