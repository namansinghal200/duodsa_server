import axios from "axios";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises"; // Import fs/promises for mkdir

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const executeCode = async (language, userCode, testCases) => {
  // --- PRODUCTION MODE: Real Judge0 API Call ---
  if (process.env.NODE_ENV === "production node server.js") {
    const LANGUAGE_MAPPING = {
      javascript: 93,
      python: 71,
      java: 62,
      cpp: 54,
    };
    const languageId = LANGUAGE_MAPPING[language];
    if (!languageId)
      throw new Error(`Language '${language}' is not supported.`);

    const executionResults = [];
    for (const testCase of testCases) {
      try {
        const submissionResponse = await axios.post(
          "https://judge0-ce.p.rapidapi.com/submissions",
          {
            language_id: languageId,
            source_code: userCode,
            stdin: testCase.input,
          },
          {
            params: { base64_encoded: "false", wait: "false" },
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        const { token } = submissionResponse.data;
        if (!token) throw new Error("Failed to create submission on Judge0.");

        let submissionResult;
        while (true) {
          const resultResponse = await axios.get(
            `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
            {
              params: { base64_encoded: "false", fields: "*" },
              headers: {
                "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
              },
            }
          );

          const statusId = resultResponse.data.status.id;
          if (statusId > 2) {
            submissionResult = resultResponse.data;
            break;
          }
          await sleep(1000);
        }

        executionResults.push({
          output: submissionResult.stdout,
          error: submissionResult.stderr,
          status: submissionResult.status.description,
          time: submissionResult.time,
          memory: submissionResult.memory,
        });
      } catch (error) {
        console.error(
          "Error executing code with Judge0:",
          error.response ? error.response.data : error.message
        );
        executionResults.push({
          output: null,
          error: "An internal error occurred while running your code.",
          status: "Internal Error",
        });
      }
    }
    return executionResults;
  }

  // --- DEVELOPMENT MODE: Local C++ Code Execution ---
  if (language !== "cpp") {
    console.warn(
      `--- DEVELOPMENT MODE: Local execution only supported for C++. Language '${language}' will be mocked. ---`
    );
    const mockResults = [];
    for (const testCase of testCases) {
      mockResults.push({
        output: testCase.expectedOutput,
        status: "Accepted",
        time: "0.01",
        memory: 1024,
        error: null,
      });
    }
    return mockResults;
  }

  console.log(
    "--- RUNNING IN DEVELOPMENT MODE: Executing C++ code locally ---"
  );

  const localResults = [];
  const tempDir = path.join(process.cwd(), "temp_code_executions"); // A temporary directory
  await fs.mkdir(tempDir, { recursive: true }).catch(() => {}); // Ensure temp dir exists

  for (const testCase of testCases) {
    const fileId = uuidv4();
    const sourceFileName = `code-${fileId}.cpp`;
    const sourceFilePath = path.join(tempDir, sourceFileName);
    const executableFileName = `a.out-${fileId}`; // Unique executable name
    const executablePath = path.join(tempDir, executableFileName);

    let output = "";
    let error = "";
    let status = "Internal Error";
    const startTime = process.hrtime.bigint(); // High-resolution time

    try {
      // 1. Write the user C++ code to a temporary file
      await writeFile(sourceFilePath, userCode);

      // 2. Compile the C++ code
      const compileProcess = spawn(
        "g++",
        [sourceFilePath, "-o", executablePath],
        { timeout: 5000, shell: true }
      ); // 5 second timeout for compilation
      const [compileStdout, compileStderr] = await new Promise(
        (resolve, reject) => {
          let stdout = "";
          let stderr = "";
          compileProcess.stdout.on(
            "data",
            (data) => (stdout += data.toString())
          );
          compileProcess.stderr.on(
            "data",
            (data) => (stderr += data.toString())
          );
          compileProcess.on("close", (code) => {
            if (code === 0) {
              resolve([stdout, stderr]);
            } else {
              reject(
                new Error(
                  `Compilation failed with exit code ${code}:\n${stderr}`
                )
              );
            }
          });
          compileProcess.on("error", (err) => reject(err));
          compileProcess.on("timeout", () => {
            compileProcess.kill();
            reject(new Error("Compilation Time Limit Exceeded"));
          });
        }
      );

      if (compileStderr) {
        error += `Compilation Output:\n${compileStderr}\n`;
      }
      if (compileStdout) {
        console.log(`C++ Compile Stdout: ${compileStdout}`); // Log compiler warnings/info
      }

      // 3. Execute the compiled C++ code
      const childProcess = spawn(executablePath, [], {
        timeout: 5000,
        shell: true,
      }); // 5 second timeout for execution

      // Provide stdin
      if (testCase.input) {
        childProcess.stdin.write(testCase.input);
        childProcess.stdin.end();
      }

      const [stdout, stderr] = await new Promise((resolve, reject) => {
        let out = "";
        let err = "";
        childProcess.stdout.on("data", (data) => (out += data.toString()));
        childProcess.stderr.on("data", (data) => (err += data.toString()));

        childProcess.on("close", (code) => {
          if (code === 0) {
            resolve([out, err]);
          } else {
            // Non-zero exit code usually means runtime error
            reject(
              new Error(`Execution failed with exit code ${code}:\n${err}`)
            );
          }
        });
        childProcess.on("error", (err) => reject(err));
        childProcess.on("timeout", () => {
          childProcess.kill(); // Kill the process if it times out
          reject(new Error("Time Limit Exceeded"));
        });
      });

      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
      const executionTimeSec = (executionTimeMs / 1000).toFixed(2); // In seconds

      output = stdout;
      error += stderr;

      // Basic status determination
      if (error) {
        status = "Runtime Error";
      } else if (output.trim() === testCase.expectedOutput.trim()) {
        status = "Accepted";
      } else {
        status = "Wrong Answer";
      }

      localResults.push({
        output: output.trim(),
        error: error.trim() || null,
        status: status,
        time: executionTimeSec,
        memory: "N/A (local)", // Accurate memory measurement is complex locally
      });
    } catch (err) {
      console.error(
        `Local C++ execution error for input "${testCase.input}":`,
        err.message
      );
      let statusMessage = "Internal Error";
      if (err.message.includes("Compilation failed")) {
        statusMessage = "Compilation Error";
        error = err.message; // Capture compilation error output
      } else if (err.message.includes("Time Limit Exceeded")) {
        statusMessage = "Time Limit Exceeded";
      } else if (err.message.includes("Execution failed")) {
        statusMessage = "Runtime Error";
        error = err.message; // Capture runtime error output
      } else {
        error = err.message; // Generic error
      }
      localResults.push({
        output: null,
        error: error,
        status: statusMessage,
        time: "N/A",
        memory: "N/A",
      });
    } finally {
      // Clean up temporary files
      await unlink(sourceFilePath).catch(() => {});
      await unlink(executablePath).catch(() => {});
    }
  }

  return localResults;
};
