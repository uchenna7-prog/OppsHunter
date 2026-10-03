import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRouter } from "./modules/auth/auth.routes.js";
import { profilesRouter } from "./modules/profiles/profiles.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { AppError } from "./lib/errors.js";
import { ZodError } from "zod";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/notifications", notificationsRouter);
app.use("/ai", aiRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: err.issues[0]?.message ?? "Invalid input" },
      });
      return;
    }

    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }

    console.error("Unexpected error:", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    });
  }
);