import express from "express";
import {
  getProblemBySlug,
  submitSolution,
  runCodeOnSampleCases, // NEW: Import new controller function
  createProblem, // NEW: Import new controller function
  getProblemTypes,
  getProblemsByType,
} from "../controllers/problemController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
// NEW: Route for creating a new problem (e.g., for admin use)
router.post("/", protect, createProblem); // Protect this route for authorized users

router.get("/types", protect, getProblemTypes);

router.get("/type/:type", protect, getProblemsByType);

// Get a single problem by slug (publicly accessible, but protect for user context)
router.get("/:slug", protect, getProblemBySlug);

// Submit a solution for a problem (runs against all test cases and saves submission)
router.post("/:slug/submit", protect, submitSolution);

// NEW: Run code against sample test cases only (does not save submission)
router.post("/:slug/run", protect, runCodeOnSampleCases);

export default router;
