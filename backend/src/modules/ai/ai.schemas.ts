import { z } from "zod";

export const testPromptSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required").max(2000, "Prompt is too long"),
});

export type TestPromptInput = z.infer<typeof testPromptSchema>;