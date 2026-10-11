import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { testPromptHandler } from "./ai.controller.js";

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 20, perUser: true }));

aiRouter.post("/test", testPromptHandler);