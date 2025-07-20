import Problem from "../models/Problem.js";
import { generateTestCases } from "../utils/testCaseGenerator.js";
import { executeCode } from "../services/codeExecutor.js";

// Helper function to normalize and compare outputs
const areOutputsEqual = (userOutput, expectedOutput) => {
  try {
    // Trim whitespace from user's output (e.g., from "1 2 3 \n")
    const normalizedUserOutput = userOutput.trim();

    // Attempt to parse the expected output as JSON (e.g., "[1,2,3,5]")
    const expectedJson = JSON.parse(expectedOutput);

    // If it's an array, we'll handle the user output specially
    if (Array.isArray(expectedJson)) {
      // Handle empty output from user
      if (normalizedUserOutput === "") {
        return expectedJson.length === 0; // Correct only if expected output is also an empty array
      }
      // Convert the user's space-separated string into a sorted array of numbers
      const userArray = normalizedUserOutput.split(/\s+/).map(Number);

      // Compare the stringified versions of the arrays
      return JSON.stringify(userArray) === JSON.stringify(expectedJson);
    }
  } catch (e) {
    // If expectedOutput is not a JSON string, fall back to simple string comparison
    return userOutput.trim() === expectedOutput.trim();
  }
  // Fallback for other types
  return userOutput.trim() === expectedOutput.trim();
};

export const getProblemBySlug = async (req, res) => {
  // This function remains the same
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).select(
      "-referenceSolution -testCaseGenerator"
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
    if (!language || !code)
      return res
        .status(400)
        .json({ message: "Language and code are required." });

    const problem = await Problem.findOne({ slug: req.params.slug }).select(
      "+referenceSolution +testCaseGenerator"
    );
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    const edgeCases = problem.testCases.filter((tc) => tc.isEdgeCase);
    const randomTestCases = await generateTestCases(
      problem.problemType,
      problem.referenceSolution,
      5
    );
    const allTestCases = [...edgeCases, ...randomTestCases];

    const executionResults = await executeCode(language, code, allTestCases);

    let passedCount = 0;
    const results = executionResults.map((result, index) => {
      // Use our new smart comparison function
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

    // FIX: The overall status logic is now correct.
    const overallStatus =
      passedCount === allTestCases.length ? "Accepted" : "Failed";
    res.json({
      status: overallStatus,
      passed: `${passedCount}/${allTestCases.length}`,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
