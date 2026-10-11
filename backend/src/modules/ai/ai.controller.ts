import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { testPromptSchema } from "./ai.schemas.js";
import * as aiService from "./ai.service.js";

export async function testPromptHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = testPromptSchema.parse(req.body);
    const response = await aiService.runTestPrompt(input.prompt);
    res.status(200).json({ response });
  } catch (err) {
    next(err);
  }
}