import { Router } from "express";
import { getCohortPulse } from "../controllers/cohort.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

// Retrieve context-based lifecycle questions
router.get("/", authMiddleware, getCohortPulse);

export default router;
