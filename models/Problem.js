import mongoose from "mongoose";

// Defines a single test case structure
const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
  isEdgeCase: {
    type: Boolean,
    default: false,
  },
});

const ProblemSchema = new mongoose.Schema(
  {
    // A unique slug for the URL, e.g., "sort-an-array"
    problemType: {
      type: String,
      enum: ["array", "string", "grid"],
      default: "array", // Default to array for backward compatibility
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String, // Can contain Markdown
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    constraints: {
      type: [String],
      default: [],
    },
    // Pre-defined test cases, including edge cases
    testCases: [TestCaseSchema],

    // A reference solution in JavaScript used to generate correct outputs for random test cases
    referenceSolution: {
      type: String,
      required: true,
      select: false, // Hide from default queries for security
    },

    // A C++ snippet to generate random test case inputs
    testCaseGenerator: {
      type: String,
      required: true,
      select: false, // Hide from default queries
    },
  },
  { timestamps: true }
);

const Problem = mongoose.model("Problem", ProblemSchema);

export default Problem;
