import express from "express";
import { getProblemBySlug, submitSolution } from "../controllers/problem.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/:slug", protect, getProblemBySlug);
router.post("/:slug/submit", protect, submitSolution);

export default router;
