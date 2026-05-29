import { Router } from "express";
import { unifiedSearch, autocompleteTags } from "../controllers/search.controller.js";

const router = Router();

router.get("/", unifiedSearch);
router.get("/tags", autocompleteTags);

export default router;
