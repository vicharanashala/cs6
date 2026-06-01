import { Router } from "express";
import { body } from "express-validator";
import { register, login, me, refresh, logout, changePassword, forgotPassword, verifyOTP, resetPassword, loginMFA, setupMFA, verifyMFA, disableMFA } from "../controllers/auth.controller.js";
import { validateRequest, validateZod } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { registerSchema, loginSchema } from "../validation/schemas.js";

const router = Router();

router.post(
  "/register",
  validateZod(registerSchema),
  register
);

router.post(
  "/login",
  validateZod(loginSchema),
  login
);

router.post("/login/mfa", loginMFA);
router.post("/mfa/setup", authMiddleware, setupMFA);
router.post("/mfa/verify", authMiddleware, verifyMFA);
router.post("/mfa/disable", authMiddleware, disableMFA);

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
