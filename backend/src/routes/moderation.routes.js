import { Router } from "express";
import { 
  getFlaggedQueue, 
  getAnsweredQueue, 
  getResolvedQueue, 
  getApprovedAnswers,
  getRejectedAnswers,
  approveItem, 
  rejectItem, 
  escalateItem, 
  getAuditLog,
  getSystemStats
} from "../controllers/moderation.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

// All moderation routes require at least Moderator role
router.use(authMiddleware);
router.use(requireRole(["moderator", "admin"]));

router.get("/stats", getSystemStats);
router.get("/queue", getFlaggedQueue);
router.get("/queue/answered", getAnsweredQueue);
router.get("/queue/resolved", getResolvedQueue);
router.get("/queue/approved-answers", getApprovedAnswers);
router.get("/queue/rejected-answers", getRejectedAnswers);

router.patch("/:targetId/approve", approveItem);
router.patch("/:targetId/reject", rejectItem);
router.patch("/:targetId/escalate", escalateItem);

// Audit log is restricted to Admin only
router.get("/audit-log", requireRole("admin"), getAuditLog);

export default router;
