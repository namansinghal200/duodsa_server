import Submission from "../models/Submission.js";
import Problem from "../models/Problem.js"; // Needed to populate problem details
import User from "../models/User.js"; // NEW: Import User model for username lookup
import mongoose from "mongoose"; // Import mongoose to use mongoose.Types.ObjectId.isValid

// @desc    Get a single submission by ID
// @route   GET /api/submissions/:id
// @access  Private (only the owner can view, temporarily public for testing)
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("problemId", "title slug") // Populate problem title and slug
      .populate("userId", "username"); // Populate username if you have a User model

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Temporarily allow any authenticated user to view any submission for testing
    // In a production environment, you would revert this to:
    // if (submission.userId._id.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ message: "Not authorized to view this submission" });
    // }

    res.json(submission);
  } catch (error) {
    console.error("Error fetching submission by ID:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all submissions with optional filters
// @route   GET /api/submissions
// @access  Private (can be filtered by user, problem, language, status, temporarily public for testing)
export const getAllSubmissions = async (req, res) => {
  try {
    // Changed userId to username and problemId to problemSlug for filtering
    const { username, problemSlug, language, status } = req.query;
    let filter = {};

    // Temporarily allow any authenticated user to fetch all submissions for testing
    // In a production environment, you would revert this to:
    // filter.userId = req.user._id; // Default to current user's submissions

    // Filter by username
    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        filter.userId = user._id;
      } else {
        return res.status(404).json({ message: "User not found." });
      }
    }

    // Filter by problem slug (or ID for flexibility)
    if (problemSlug) {
      const problem = await Problem.findOne({ slug: problemSlug });
      if (problem) {
        filter.problemId = problem._id;
      } else if (mongoose.Types.ObjectId.isValid(problemSlug)) {
        // Keep this for flexibility in case an ID is sent
        filter.problemId = problemSlug;
      } else {
        return res
          .status(400)
          .json({ message: "Invalid problem slug or ID provided." });
      }
    }

    // Filter by language
    if (language) {
      filter.language = language;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    const submissions = await Submission.find(filter)
      .select("-code -results") // NEW: Exclude 'code' and 'results' fields
      .populate("problemId", "title slug") // Populate problem title and slug
      .populate("userId", "username") // Populate username
      .sort({ submittedAt: -1 }); // Sort by most recent first

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
