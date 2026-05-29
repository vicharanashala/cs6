import { Router } from "express";
import { getFAQs, searchQuestions, promoteQuestionToFAQ } from "../controllers/faq.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import allow from "../middlewares/permissionMiddleware.js";

const router = Router();

// Public routes
router.get("/faqs", getFAQs);
router.get("/search", searchQuestions);

// Administrative route
router.post("/faq/promote", authMiddleware, allow("manage_faq"), promoteQuestionToFAQ);

export default router;
