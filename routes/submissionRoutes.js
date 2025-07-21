import express from "express";
import {
  getSubmissionById,
  getAllSubmissions,
} from "../controllers/submissionController.js";
import { protect } from "../middleware/auth.js"; // Assuming you have an auth middleware

const router = express.Router();

// Route to get all submissions with optional filters
// Example: GET /api/submissions?userId=...&problemId=...&language=...&status=...
router.get("/", protect, getAllSubmissions);

// Route to get a specific submission by ID
// Example: GET /api/submissions/:id
router.get("/:id", protect, getSubmissionById);

export default router;
