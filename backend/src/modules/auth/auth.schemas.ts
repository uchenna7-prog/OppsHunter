import { z } from "zod";

const emailRule = z.string().trim().toLowerCase().email("Invalid email address");

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const codeRule = z.string().regex(/^\d{6}$/, "Code must be 6 digits");

export const registerSchema = z.object({
  email: emailRule,
  password: passwordRule,
  deviceName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, "Password is required"),
  deviceName: z.string().max(100).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
  deviceName: z.string().max(100).optional(),
});

export const verifyEmailSchema = z.object({
  code: codeRule,
});

export const requestPasswordResetSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z.object({
  email: emailRule,
  code: codeRule,
  newPassword: passwordRule,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;