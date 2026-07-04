import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import { setupSwagger } from "./docs/swagger.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { sendResponse } from "./utils/response.js";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim(),
);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiRateLimiter);
app.use(morgan(isProduction ? "combined" : "dev"));

setupSwagger(app);

app.get("/health", (_req, res) => {
  sendResponse(res, 200, "Expense Tracker API is healthy", {
    service: "expense-tracker-api",
    environment: env.NODE_ENV,
  });
});

app.get("/api", (_req, res) => {
  sendResponse(res, 200, "Expense Tracker API", {
    docs: "/api/docs",
    health: "/health",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
