import { Router } from "express";
import { body } from "express-validator";
import { 
  getQuestions, 
  createQuestion, 
  getQuestionById, 
  editQuestion, 
  deleteQuestion, 
  changeQuestionStatus, 
  promoteQuestionToFAQ, 
  getFAQs, 
  getSimilarQuestions,
  getDuplicateQuestions,
  toggleHelpfulVote,
  revertFAQ
} from "../controllers/questions.controller.js";
import { unifiedSearch } from "../controllers/search.controller.js";
import { validateRequest, validateZod } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole, requireOwnerOrRole } from "../middlewares/roleMiddleware.js";
import Question from "../models/Question.js";
import answerRoutes from "./answer.routes.js";
import { createQuestionSchema } from "../validation/schemas.js";

const router = Router();

// Mount nested answers router
router.use("/:id/answers", answerRoutes);

// Public listing and search routes
router.get("/", getQuestions);
router.get("/search", unifiedSearch);
router.get("/similar", getSimilarQuestions);
router.post("/duplicates", getDuplicateQuestions);
router.get("/faqs", getFAQs);
router.get("/:id", getQuestionById);

// Authenticated route to create question
router.post(
  "/",
  authMiddleware,
  validateZod(createQuestionSchema),
  createQuestion
);

// Helpful vote route
router.patch("/:id/helpful", authMiddleware, toggleHelpfulVote);

// Ownership / privilege modifying routes
router.patch(
  "/:id",
  authMiddleware,
  requireOwnerOrRole(Question, 'author', ['admin', 'moderator']), // owner, admin or moderator can edit
  [
    body("title").optional().trim().isLength({ min: 10, max: 150 }).withMessage("Title must be between 10 and 150 characters"),
    body("body").optional().trim().isLength({ min: 20 }).withMessage("Body must be at least 20 characters long"),
    body("tags").optional().isArray({ min: 1, max: 5 }).withMessage("Tags must be an array of 1 to 5 strings"),
    body("tags.*").optional().trim().notEmpty().withMessage("Tag value cannot be empty"),
    body("category").optional().isMongoId().withMessage("Category must be a valid Mongo ID"),
    body("lifecycleBucket").optional({ nullable: true }).isIn(['onboarding', 'documentation', 'vibe', 'projects', null]).withMessage("Invalid lifecycle bucket value")
  ],
  validateRequest,
  editQuestion
);

router.delete(
  "/:id",
  authMiddleware,
  requireOwnerOrRole(Question, 'author', ['admin']), // owner or admin can soft-delete
  deleteQuestion
);

// Administrative / Moderation routes
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole(["moderator", "admin"]),
  [
    body("status").isIn(["unresolved", "flagged", "answered", "resolved", "open", "closed", "deleted"]).withMessage("Invalid status value")
  ],
  validateRequest,
  changeQuestionStatus
);

router.post("/:id/faq", authMiddleware, requireRole("admin"), promoteQuestionToFAQ);
router.delete("/:id/faq", authMiddleware, requireRole("admin"), revertFAQ);

export default router;
