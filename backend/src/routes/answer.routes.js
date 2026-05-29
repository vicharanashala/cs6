import { Router } from "express";
import { body } from "express-validator";
import { 
  getAnswersForQuestion, 
  createAnswer, 
  editAnswer, 
  deleteAnswer, 
  upvoteAnswer, 
  downvoteAnswer,
  markAsBestAnswer 
} from "../controllers/answers.controller.js";
import { validateRequest } from "../middlewares/validate.js";
import authMiddleware, { optionalAuthMiddleware } from "../middlewares/authMiddleware.js";
import { requireOwnerOrRole, requireRole } from "../middlewares/roleMiddleware.js";
import Answer from "../models/Answer.js";

// mergeParams: true allows accessing req.params.id (Question ID) from nested routes
const router = Router({ mergeParams: true });

router.get("/", optionalAuthMiddleware, getAnswersForQuestion);

router.post(
  "/",
  authMiddleware,
  [
    body("body").trim().isLength({ min: 30, max: 2000 }).withMessage("Answer body must be between 30 and 2000 characters")
  ],
  validateRequest,
  createAnswer
);

router.patch(
  "/:aid",
  authMiddleware,
  requireOwnerOrRole(Answer, 'author', []), // only answer owner
  [
    body("body").trim().isLength({ min: 30, max: 2000 }).withMessage("Answer body must be between 30 and 2000 characters")
  ],
  validateRequest,
  editAnswer
);

router.delete(
  "/:aid",
  authMiddleware,
  requireOwnerOrRole(Answer, 'author', ['admin']), // owner or admin
  deleteAnswer
);

router.post("/:aid/upvote", authMiddleware, upvoteAnswer);
router.post("/:aid/downvote", authMiddleware, downvoteAnswer);

router.patch("/:aid/best", authMiddleware, requireRole(["moderator", "admin"]), markAsBestAnswer);

export default router;
