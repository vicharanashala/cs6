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
import { validateRequest, validateZod } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { upload, getPresignedUploadUrl } from "../services/upload.service.js";
import { createTicketSchema } from "../validation/schemas.js";

const router = Router();

// Ticket management requires user authentication
router.use(authMiddleware);

router.get("/", getTickets);

router.post(
  "/",
  validateZod(createTicketSchema),
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

// S3 Presigned Upload URL (direct client-to-S3 upload)
router.post("/:id/presigned-upload", (req, res) => {
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'filename and contentType are required'
      }
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(contentType)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid content type. Allowed: ${allowedTypes.join(', ')}`
      }
    });
  }

  const result = getPresignedUploadUrl(filename, contentType);
  return res.status(200).json({
    success: true,
    data: result
  });
});

export default router;
