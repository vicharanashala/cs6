import { Router } from "express";
import { body } from "express-validator";
import { register, login, me, refresh, logout, changePassword, forgotPassword, verifyOTP, resetPassword } from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.post(
  "/register",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("email").trim().isEmail().withMessage("Must be a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one digit")
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Must be a valid email address"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  login
);

router.get("/me", authMiddleware, me);

router.post("/refresh", refresh);

router.post("/logout", authMiddleware, logout);

router.patch(
  "/password",
  authMiddleware,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one digit")
  ],
  validateRequest,
  changePassword
);

// ─── Forgot Password Flow ──────────────────────────────────────────────────────

router.post(
  "/forgot-password",
  [
    body("email").trim().isEmail().withMessage("Must be a valid email address")
  ],
  validateRequest,
  forgotPassword
);

router.post(
  "/verify-otp",
  [
    body("email").trim().isEmail().withMessage("Must be a valid email address"),
    body("otp")
      .trim()
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be a 6-digit number")
  ],
  validateRequest,
  verifyOTP
);

router.post(
  "/reset-password",
  [
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one digit")
  ],
  validateRequest,
  resetPassword
);

export default router;
