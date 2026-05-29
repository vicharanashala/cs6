import { Router } from "express";
import { body } from "express-validator";
import { getCategories, getCategoryById, createCategory, editCategory, deleteCategory } from "../controllers/category.controller.js";
import { validateRequest } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin-only routes
router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  [
    body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be between 2 and 60 characters"),
    body("description").optional().trim().isLength({ max: 200 }).withMessage("Description cannot exceed 200 characters")
  ],
  validateRequest,
  createCategory
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  [
    body("name").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Name must be between 2 and 60 characters"),
    body("description").optional().trim().isLength({ max: 200 }).withMessage("Description cannot exceed 200 characters")
  ],
  validateRequest,
  editCategory
);

router.delete("/:id", authMiddleware, requireRole("admin"), deleteCategory);

export default router;
