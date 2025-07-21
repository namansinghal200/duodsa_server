import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { generateTestCases } from "../utils/testCaseGenerator.js";
import { executeCode } from "../services/codeExecutor.js";
import mongoose from "mongoose"; // Import mongoose for isValidObjectId

// Helper function to normalize and compare outputs
const areOutputsEqual = (userOutput, expectedOutput) => {
  const normalizedUserOutput = userOutput.trim();
  let parsedExpectedOutput;

  try {
    parsedExpectedOutput = JSON.parse(expectedOutput);
  } catch (e) {
    // If expectedOutput is not valid JSON, treat it as a plain string
    return normalizedUserOutput === expectedOutput.trim();
  }

  // --- Handle Array Outputs (1D or 2D) ---
  if (Array.isArray(parsedExpectedOutput)) {
    // Handle empty output from user
    if (normalizedUserOutput === "") {
      return parsedExpectedOutput.length === 0;
    }

    // If expected is a 2D array (grid)
    if (
      parsedExpectedOutput.length > 0 &&
      Array.isArray(parsedExpectedOutput[0])
    ) {
      // Attempt to parse userOutput into a 2D array
      // Assumes user output is space-separated numbers per row, newline separated rows
      const userGrid = normalizedUserOutput
        .split("\n")
        .map((row) => row.trim().split(/\s+/).map(Number));

      // Deep comparison for 2D arrays
      if (userGrid.length !== parsedExpectedOutput.length) return false;
      for (let i = 0; i < userGrid.length; i++) {
        if (userGrid[i].length !== parsedExpectedOutput[i].length) return false;
        for (let j = 0; j < userGrid[i].length; j++) {
          if (userGrid[i][j] !== parsedExpectedOutput[i][j]) return false;
        }
      }
      return true;
    } else {
      // If expected is a 1D array (e.g., [1,2,3])
      const userArray = normalizedUserOutput.split(/\s+/).map(Number);
      return JSON.stringify(userArray) === JSON.stringify(parsedExpectedOutput);
    }
  } else {
    // --- Handle Primitive Outputs (string, number, boolean, null) ---
    return normalizedUserOutput === String(parsedExpectedOutput).trim();
  }
};

export const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).select(
      "-referenceSolution"
    );
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const submitSolution = async (req, res) => {
  try {
    const { language, code } = req.body;
    const userId = req.user._id;

    if (!language || !code)
      return res
        .status(400)
        .json({ message: "Language and code are required." });

    const problem = await Problem.findOne({ slug: req.params.slug }).select(
      "+referenceSolution inputType problemType" // Select inputType and problemType
    );
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const edgeCases = problem.testCases.filter((tc) => tc.isEdgeCase);
    const randomTestCases = await generateTestCases(
      problem.problemType,
      problem.referenceSolution,
      5,
      problem.inputType // Pass inputType
    );
    const allTestCases = [...edgeCases, ...randomTestCases];

    const executionResults = await executeCode(language, code, allTestCases);

    let passedCount = 0;
    const results = executionResults.map((result, index) => {
      const isCorrect = areOutputsEqual(
        result.output || "",
        allTestCases[index].expectedOutput
      );

      if (isCorrect) passedCount++;

      return {
        testCase: index + 1,
        status: result.status,
        isCorrect,
        userOutput: result.output,
        expectedOutput: allTestCases[index].expectedOutput,
        time: result.time,
        memory: result.memory,
        error: result.error,
      };
    });

    const overallStatus =
      passedCount === allTestCases.length ? "Accepted" : "Failed";

    const submission = await Submission.create({
      userId,
      problemId: problem._id,
      language,
      code,
      status: overallStatus,
      results,
      submittedAt: new Date(),
    });

    res.json({
      status: overallStatus,
      passed: `${passedCount}/${allTestCases.length}`,
      results,
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("Error submitting solution:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const runCodeOnSampleCases = async (req, res) => {
  try {
    const { language, code } = req.body;
    if (!language || !code) {
      return res
        .status(400)
        .json({ message: "Language and code are required." });
    }

    const problem = await Problem.findOne({ slug: req.params.slug }).select(
      "sampleCases inputType problemType" // Select inputType and problemType
    );
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    if (!problem.sampleCases || problem.sampleCases.length === 0) {
      return res
        .status(404)
        .json({ message: "No sample test cases found for this problem." });
    }

    const executionResults = await executeCode(
      language,
      code,
      problem.sampleCases
    );

    let passedCount = 0;
    const results = executionResults.map((result, index) => {
      const isCorrect = areOutputsEqual(
        result.output || "",
        problem.sampleCases[index].expectedOutput
      );

      if (isCorrect) passedCount++;

      return {
        testCase: index + 1,
        status: result.status,
        isCorrect,
        userOutput: result.output,
        expectedOutput: problem.sampleCases[index].expectedOutput,
        time: result.time,
        memory: result.memory,
        error: result.error,
      };
    });

    const overallStatus =
      passedCount === problem.sampleCases.length ? "Accepted" : "Failed";

    res.json({
      status: overallStatus,
      passed: `${passedCount}/${problem.sampleCases.length}`,
      results,
      message: "Code executed on sample test cases.",
    });
  } catch (error) {
    console.error("Error running code on sample cases:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const createProblem = async (req, res) => {
  try {
    const {
      problemType,
      inputType, // NEW: Destructure inputType from req.body
      slug,
      title,
      description,
      difficulty,
      constraints,
      testCases,
      sampleCases,
      referenceSolution,
    } = req.body;

    // Basic validation for required fields
    if (
      !slug ||
      !title ||
      !description ||
      !difficulty ||
      !referenceSolution ||
      !inputType
    ) {
      // Added inputType to validation
      return res
        .status(400)
        .json({ message: "Missing required problem fields." });
    }

    const existingProblem = await Problem.findOne({ slug });
    if (existingProblem) {
      return res
        .status(409)
        .json({ message: "Problem with this slug already exists." });
    }

    const newProblem = await Problem.create({
      problemType,
      inputType, // NEW: Include inputType when creating the problem
      slug,
      title,
      description,
      difficulty,
      constraints,
      testCases: testCases || [],
      sampleCases: sampleCases || [],
      referenceSolution,
    });

    res.status(201).json({
      message: "Problem created successfully!",
      problem: newProblem,
    });
  } catch (error) {
    console.error("Error creating problem:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// NEW: @desc Get all distinct problem types
// @route GET /api/problems/types
// @access Public (or Private if you want to restrict)
export const getProblemTypes = async (req, res) => {
  try {
    // Use distinct to get all unique values for the problemType field
    const types = await Problem.distinct("problemType");
    res.json(types);
  } catch (error) {
    console.error("Error fetching problem types:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// NEW: @desc Get problems by problemType
// @route GET /api/problems/type/:type
// @access Private (or Public if you want to allow unauthenticated access)
export const getProblemsByType = async (req, res) => {
  try {
    const { type } = req.params; // Get the problemType from the URL parameters
    const problems = await Problem.find({ problemType: type }).select(
      "-referenceSolution -testCases -sampleCases" // Exclude large fields
    );
    if (!problems || problems.length === 0) {
      return res
        .status(404)
        .json({ message: `No problems found for type: ${type}` });
    }
    res.json(problems);
  } catch (error) {
    console.error(`Error fetching problems by type ${req.params.type}:`, error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
