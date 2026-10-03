import { z } from "zod";

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(1, "token is required"),
  platform: z.enum(["android", "ios"]).default("android"),
});

export const unregisterDeviceTokenSchema = z.object({
  token: z.string().min(1, "token is required"),
});

export const testNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
export type UnregisterDeviceTokenInput = z.infer<typeof unregisterDeviceTokenSchema>;
export type TestNotificationInput = z.infer<typeof testNotificationSchema>;