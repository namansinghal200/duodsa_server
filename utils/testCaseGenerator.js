// A collection of helper functions to generate different types of random inputs.

/**
 * Generates a random array of integers.
 * @param {number} size - The number of elements in the array.
 * @param {number} minVal - The minimum possible value for an element.
 * @param {number} maxVal - The maximum possible value for an element.
 * @returns {number[]} - The generated array.
 */
const generateRandomArray = (size, minVal, maxVal) => {
  return Array.from(
    { length: size },
    () => Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal
  );
};

/**
 * Generates a random string of a given length.
 * @param {number} length - The length of the string.
 * @param {string} [charset] - The set of characters to choose from.
 * @returns {string} - The generated random string.
 */
const generateRandomString = (
  length,
  charset = "abcdefghijklmnopqrstuvwxyz"
) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Generates a random 2D grid (matrix) of integers.
 * @param {number} rows - The number of rows.
 * @param {number} cols - The number of columns.
 * @param {number} minVal - The minimum possible value for an element.
 * @param {number} maxVal - The maximum possible value for an element.
 * @returns {number[][]} - The generated 2D grid.
 */
const generateRandomGrid = (rows, cols, minVal, maxVal) => {
  const grid = [];
  for (let i = 0; i < rows; i++) {
    grid.push(generateRandomArray(cols, minVal, maxVal));
  }
  return grid;
};

/**
 * Main function to generate test cases based on the problem type.
 *
 * @param {string} problemType - The type of problem ('array', 'string', 'grid').
 * @param {string} referenceSolution - The JS function string to solve the problem.
 * @param {number} count - The number of random test cases to generate.
 * @returns {Promise<Array>} - A promise that resolves to an array of test case objects.
 */
export const generateTestCases = async (
  problemType,
  referenceSolution,
  count
) => {
  const generatedTestCases = [];
  // WARNING: In a real app, use a secure sandbox like 'vm2' instead of eval!
  const solve = eval(`(${referenceSolution})`);

  for (let i = 0; i < count; i++) {
    let inputData;
    let inputString;

    switch (problemType) {
      case "string":
        const strLength = Math.floor(Math.random() * 15) + 5; // Length 5-19
        inputData = generateRandomString(strLength);
        inputString = inputData; // For strings, input is just the string itself
        break;

      case "grid":
        const rows = Math.floor(Math.random() * 8) + 3; // 3-10 rows
        const cols = Math.floor(Math.random() * 8) + 3; // 3-10 cols
        inputData = generateRandomGrid(rows, cols, 0, 100);
        // Format for C++: rows cols\n...grid data...
        inputString = `${rows} ${cols}\n${inputData
          .map((row) => row.join(" "))
          .join("\n")}`;
        break;

      case "array":
      default:
        const arrSize = Math.floor(Math.random() * 20) + 1;
        inputData = generateRandomArray(arrSize, 0, 100);
        // Format for C++: size\n...array data...
        inputString = `${inputData.length}\n${inputData.join(" ")}`;
        break;
    }

    // Use the reference solution to get the correct output
    const expectedOutput = JSON.stringify(solve(inputData));

    generatedTestCases.push({
      input: inputString,
      expectedOutput,
      isEdgeCase: false,
    });
  }

  return generatedTestCases;
};
