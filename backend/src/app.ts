import express from "express";
import helmet from "helmet";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes.js";
import { profilesRouter } from "./modules/profiles/profiles.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/notifications", notificationsRouter);
app.use("/ai", aiRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandler);