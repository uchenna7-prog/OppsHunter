import {
  deleteExpiredAuthData,
  findAccountsPastDeletionGracePeriod,
  deleteUserDataAndAnonymize,
} from "../modules/auth/auth.repository.js";
import { env } from "../config/env.js";

export async function runExpiredTokenCleanup(): Promise<void> {
  const result = await deleteExpiredAuthData();
  console.log(
    `[cron] Expired auth data cleanup: ${result.refreshTokens} refresh tokens, ` +
    `${result.authTokens} auth tokens, ${result.sessions} sessions removed`
  );
}

export async function runAccountDeletionSweep(): Promise<void> {
  const userIds = await findAccountsPastDeletionGracePeriod(env.ACCOUNT_DELETION_GRACE_DAYS);

  for (const userId of userIds) {
    await deleteUserDataAndAnonymize(userId);
    console.log(`[cron] Anonymized account past deletion grace period: ${userId}`);
  }

  if (userIds.length > 0) {
    console.log(`[cron] Account deletion sweep complete: ${userIds.length} account(s) processed`);
  }
}