// app.js
// Express application setup — middleware, routes, error handling

import express from "express";
import cors from "cors";
import apiRoutes from "./src/routes/index.js";
import errorHandler from "./src/middlewares/errorHandler.js";

import rateLimit from "express-rate-limit";

const app = express();

// ─── Global Middleware ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting (as specified in API_v2.pdf Page 10) ───
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const devOrGetSkip = (req) => req.method === "GET" || isDev;

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, skip: () => isDev, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } } }));
app.use("/api/questions", rateLimit({ windowMs: 15 * 60 * 1000, max: 30, skip: devOrGetSkip, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } } }));
app.use("/api/tickets", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, skip: devOrGetSkip, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } } }));
app.use("/api/reports", rateLimit({ windowMs: 15 * 60 * 1000, max: 15, skip: devOrGetSkip, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } } }));

// ─── API Routes ──────────────────────────────────────────
app.use("/api", apiRoutes);

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ─── Centralized Error Handler ───────────────────────────
app.use(errorHandler);

export default app;
