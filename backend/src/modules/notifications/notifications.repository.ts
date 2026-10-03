import { pool } from "../../db/pool.js";

export interface DeviceTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: "android" | "ios";
  created_at: string;
  last_used_at: string;
}

export async function upsertDeviceToken(
  userId: string,
  token: string,
  platform: "android" | "ios"
): Promise<DeviceTokenRow> {
  const result = await pool.query<DeviceTokenRow>(
    `INSERT INTO device_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           platform = EXCLUDED.platform,
           last_used_at = now()
     RETURNING *`,
    [userId, token, platform]
  );
  return result.rows[0]!;
}

export async function removeDeviceToken(userId: string, token: string): Promise<void> {
  await pool.query(
    `DELETE FROM device_tokens WHERE user_id = $1 AND token = $2`,
    [userId, token]
  );
}

export async function listDeviceTokensForUser(userId: string): Promise<DeviceTokenRow[]> {
  const result = await pool.query<DeviceTokenRow>(
    `SELECT * FROM device_tokens WHERE user_id = $1`,
    [userId]
  );
  return result.rows;
}

export async function deleteDeviceTokenByValue(token: string): Promise<void> {
  await pool.query(`DELETE FROM device_tokens WHERE token = $1`, [token]);
}