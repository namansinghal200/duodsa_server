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
      enum: ["array", "string", "grid", "dynamic-programming"], // Added "dynamic-programming"
      default: "array",
    },
    inputType: {
      // THIS FIELD MUST BE PRESENT AND MARKED AS REQUIRED
      type: String,
      enum: [
        "array", // Single array input (e.g., sort-an-array)
        "string", // Single string input (e.g., longest-palindromic-substring)
        "grid", // 2D array/grid input
        "array-int", // Array and a single integer (e.g., House Robber, LIS)
        "int-array", // Single integer and an array (e.g., Coin Change: amount, coins[])
        "array-array-int", // Two arrays and a single integer (e.g., Unbounded Knapsack: val[], wt[], W)
        "array-array", // Two arrays
        "int-array-int", // Two integers and an array (e.g. Stocks with K transactions: k, prices[])
      ],
      required: true, // <--- THIS IS CRUCIAL
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
    // Pre-defined test cases, including edge cases, used for actual submission judging
    testCases: [TestCaseSchema],
    // Sample test cases displayed to the user
    sampleCases: [TestCaseSchema],

    // A reference solution in JavaScript used to generate correct outputs for random test cases
    referenceSolution: {
      type: String,
      required: true,
      select: false, // Hide from default queries for security
    },
  },
  { timestamps: true }
);

const Problem = mongoose.model("Problem", ProblemSchema);

export default Problem;
