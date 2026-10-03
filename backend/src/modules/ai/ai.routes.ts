import { Router } from "express";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { authenticate } from "../auth/auth.middleware.js";
import { z } from "zod";
import { askAI } from "../../lib/ai/index.js";

export const aiRouter = Router();

aiRouter.use(authenticate);

const testPromptSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

aiRouter.post("/test", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = testPromptSchema.parse(req.body);
    const response = await askAI(input.prompt);
    res.status(200).json({ response });
  } catch (err) {
    next(err);
  }
});