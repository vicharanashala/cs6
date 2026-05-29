import { Router } from "express";
import { body } from "express-validator";
import { 
  getUserProfile, 
  getUserQuestions, 
  getUserAnswers, 
  updateMe, 
  listUsers, 
  changeUserRole, 
  deactivateUser 
} from "../controllers/users.controller.js";
import { validateRequest } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

// Public routes
router.get("/:id/profile", getUserProfile);
router.get("/:id/questions", getUserQuestions);
router.get("/:id/answers", getUserAnswers);

// User-only editing routes
router.patch(
  "/me",
  authMiddleware,
  [
    body("name").optional().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("avatar").optional().trim().custom(value => {
      if (value === "") return true;
      try {
        new URL(value);
        return true;
      } catch (err) {
        throw new Error("Avatar must be a valid URL");
      }
    }),
    body("role").optional().isIn(["user", "moderator", "admin"]).withMessage("Invalid role value"),
    body("profileMetadata").optional().isObject().withMessage("profileMetadata must be an object")
  ],
  validateRequest,
  updateMe
);

// Admin-only management routes
router.get("/", authMiddleware, requireRole("admin"), listUsers);

router.patch(
  "/:id/role",
  authMiddleware,
  requireRole("admin"),
  [
    body("role").isIn(["user", "moderator", "admin"]).withMessage("Invalid role value")
  ],
  validateRequest,
  changeUserRole
);

router.delete("/:id", authMiddleware, requireRole("admin"), deactivateUser);

export default router;
