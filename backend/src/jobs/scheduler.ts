import cron from "node-cron";
import { runExpiredTokenCleanup, runAccountDeletionSweep } from "./authCleanup.js";

export function startScheduledJobs(): void {
  // Every day at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    try {
      await runExpiredTokenCleanup();
    } catch (err) {
      console.error("[cron] Expired token cleanup failed:", err);
    }
  });

  // Every day at 3:15 AM
  cron.schedule("15 3 * * *", async () => {
    try {
      await runAccountDeletionSweep();
    } catch (err) {
      console.error("[cron] Account deletion sweep failed:", err);
    }
  });

  console.log("Scheduled jobs registered");
}