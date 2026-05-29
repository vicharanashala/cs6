import { Router } from "express";
import { body } from "express-validator";
import { 
  getTickets, 
  createTicket, 
  getTicketById, 
  updateTicketStatus, 
  postTicketMessage, 
  uploadAttachment, 
  deleteAttachment, 
  assignTicket 
} from "../controllers/tickets.controller.js";
import { validateRequest } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { upload } from "../services/upload.service.js";

const router = Router();

// Ticket management requires user authentication
router.use(authMiddleware);

router.get("/", getTickets);

router.post(
  "/",
  [
    body("title").trim().isLength({ min: 5, max: 100 }).withMessage("Title must be between 5 and 100 characters"),
    body("description").trim().isLength({ min: 20, max: 2000 }).withMessage("Description must be between 20 and 2000 characters")
  ],
  validateRequest,
  createTicket
);

router.get("/:id", getTicketById);

router.patch(
  "/:id/status",
  requireRole(["moderator", "admin"]),
  [
    body("status").isIn(["open", "in_progress", "resolved"]).withMessage("Invalid status value")
  ],
  validateRequest,
  updateTicketStatus
);

router.post(
  "/:id/messages",
  [
    body("body").trim().isLength({ min: 1, max: 2000 }).withMessage("Message body must be between 1 and 2000 characters")
  ],
  validateRequest,
  postTicketMessage
);

// Upload attachment
router.post("/:id/attachments", upload.single("file"), uploadAttachment);

// Delete attachment
router.delete("/:id/attachments/:aid", deleteAttachment);

// Assign ticket
router.patch(
  "/:id/assign",
  requireRole(["moderator", "admin"]),
  [
    body("assignedTo").isMongoId().withMessage("assignedTo must be a valid Mongo ID")
  ],
  validateRequest,
  assignTicket
);

export default router;
