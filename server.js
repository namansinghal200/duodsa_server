import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import problemRoutes from "./routes/problem.js"; // <-- Import problem routes
import Problem from "./models/Problem.js"; // <-- Import Problem model for seeder

// --- Initial Setup ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("SUCCESS: MongoDB connected successfully."))
  .catch((err) => console.error("ERROR: MongoDB connection error:", err));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes); // <-- Use problem routes

// --- Root Endpoint ---
app.get("/", (req, res) => {
  res.send("DSA-Lingo API is running...");
});

// --- Seeder Endpoint (for development only) ---
app.post("/api/seed", async (req, res) => {
  try {
    await Problem.deleteMany(); // Clear existing problems

    const sortProblem = {
      problemtype: "array",
      slug: "sort-an-array",
      title: "Sort an Array",
      description:
        "Given an array of integers `nums`, sort the array in ascending order and return it. You must solve the problem **without using any built-in sort functions**.",
      difficulty: "Easy",
      constraints: [
        "`1 <= nums.length <= 5 * 10^4`",
        "`-5 * 10^4 <= nums[i] <= 5 * 10^4`",
      ],
      testCases: [
        // FIX: Updated input format to be user-friendly
        { input: "4\n5 2 3 1", expectedOutput: "[1,2,3,5]", isEdgeCase: true },
        {
          input: "6\n5 1 1 2 0 0",
          expectedOutput: "[0,0,1,1,2,5]",
          isEdgeCase: true,
        },
        { input: "0\n", expectedOutput: "[]", isEdgeCase: true }, // For empty array
        {
          input: "4\n-1 -5 2 4",
          expectedOutput: "[-5,-1,2,4]",
          isEdgeCase: true,
        },
      ],
      referenceSolution: `
    function sortArray(nums) {
      // Using built-in sort for the reference solution is fine
      // as it's only used on the backend to verify test cases.
      return nums.sort((a, b) => a - b);
    }
  `,
      testCaseGenerator: `
    // This is now just for reference, the logic is in testCaseGenerator.js
  `,
    };

    await Problem.create(sortProblem);
    res.status(201).send("Database seeded successfully with the sort problem!");
  } catch (error) {
    res.status(500).send(`Error seeding database: ${error.message}`);
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
