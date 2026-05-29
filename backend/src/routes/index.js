// src/routes/index.js
// Central route aggregator — all route modules are registered here

import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import questionRoutes from "./question.routes.js";
import moderationRoutes from "./moderation.routes.js";
import searchRoutes from "./search.routes.js";
import reportRoutes from "./report.routes.js";
import ticketRoutes from "./ticket.routes.js";
import notificationRoutes from "./notification.routes.js";
import userRoutes from "./user.routes.js";
import bookmarkRoutes from "./bookmark.routes.js";

const router = Router();

// Mount route modules
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/questions", questionRoutes);
router.use("/moderation", moderationRoutes);
router.use("/search", searchRoutes);
router.use("/reports", reportRoutes);
router.use("/tickets", ticketRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userRoutes);
router.use("/bookmarks", bookmarkRoutes);

export default router;
