// src/routes/health.routes.js
// Health check route definition

import { Router } from "express";
import { getHealthStatus } from "../controllers/health.controller.js";

const router = Router();

// GET /api/health — returns API status
router.get("/", getHealthStatus);

export default router;
