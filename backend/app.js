// app.js
// Express application setup — middleware, routes, error handling

import express from "express";
import cors from "cors";
import apiRoutes from "./src/routes/index.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import { sanitizeMiddleware } from "./src/middlewares/sanitize.js";
import { csrfProtection } from "./src/middlewares/csrfMiddleware.js";

import rateLimit from "express-rate-limit";

const app = express();

// ─── Security Headers ────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https://api-inference.huggingface.co;");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ─── Global Middleware ───────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);
app.use("/api", csrfProtection);

// ─── Rate Limiting ───────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } }
});

const questionPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many questions posted. Limit is 10 per hour." } }
});

const answerPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many answers posted. Limit is 30 per hour." } }
});

// Apply rate limiting
app.use("/api", generalLimiter);
app.post("/api/questions", questionPostLimiter);
app.post("/api/questions/:id/answers", answerPostLimiter);

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
