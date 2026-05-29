import { Router } from "express";
import { body } from "express-validator";
import { 
  createReport, 
  getReports, 
  getReportById, 
  resolveReport, 
  dismissReport 
} from "../controllers/reports.controller.js";
import { validateRequest } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

// Submit report is available to all authenticated users
router.post(
  "/",
  authMiddleware,
  [
    body("targetType").isIn(["question", "answer"]).withMessage("Target type must be 'question' or 'answer'"),
    body("targetId").isMongoId().withMessage("Target ID must be a valid Mongo ID"),
    body("type")
      .isIn(["spam", "abuse", "misinformation", "irrelevant", "outdated"])
      .withMessage("Invalid report type"),
    body("description").optional().trim().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters")
  ],
  validateRequest,
  createReport
);

// All other report management endpoints require Moderator/Admin privileges
router.use(authMiddleware);
router.use(requireRole(["moderator", "admin"]));

router.get("/", getReports);
router.get("/:id", getReportById);
router.patch("/:id/resolve", resolveReport);
router.patch("/:id/dismiss", dismissReport);

export default router;
