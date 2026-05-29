import { Router } from "express";
import { getBookmarks, toggleBookmark } from "../controllers/bookmarks.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getBookmarks);
router.post("/toggle", toggleBookmark);

export default router;
