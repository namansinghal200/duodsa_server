// A collection of helper functions to generate different types of random inputs.

/**
 * Generates a random array of integers.
 * @param {number} size - The number of elements in the array.
 * @param {number} minVal - The minimum possible value for an element.
 * @param {number} maxVal - The maximum possible value for an element.\
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
 * @param {string} problemType - The type of problem ('array', 'string', 'grid', 'dynamic-programming').
 * @param {string} referenceSolution - The JS function string to solve the problem.
 * @param {number} count - The number of random test cases to generate.
 * @returns {Promise<Array>} - A promise that resolves to an array of test case objects.
 */
export const generateTestCases = async (
  problemType,
  referenceSolution,
  count,
  inputType // NEW: Pass inputType here
) => {
  const generatedTestCases = [];
  // WARNING: In a real app, use a secure sandbox like 'vm2' instead of eval!
  const solve = eval(`(${referenceSolution})`);

  for (let i = 0; i < count; i++) {
    let inputData; // This will be the parsed data passed to the JS reference solution
    let inputString; // This will be the string representation for C++ stdin

    // Generate inputData based on inputType
    switch (inputType) {
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
        const arrSize = Math.floor(Math.random() * 20) + 1;
        inputData = generateRandomArray(arrSize, 0, 100);
        // Format for C++: size\n...array data...
        inputString = `${inputData.length}\n${inputData.join(" ")}`;
        break;

      case "array-int": // e.g., House Robber (nums[]), LIS (nums[])
        const arrIntSize = Math.floor(Math.random() * 20) + 1;
        inputData = generateRandomArray(arrIntSize, 0, 100); // Only the array
        inputString = `${inputData.length}\n${inputData.join(" ")}`;
        break;

      case "int-array": // e.g., Coin Change (amount, coins[])
        const amount = Math.floor(Math.random() * 50) + 1; // Amount up to 50
        const coinsSize = Math.floor(Math.random() * 5) + 1; // 1-5 coins
        const coins = generateRandomArray(coinsSize, 1, 20); // Coin values 1-20
        inputData = [amount, coins]; // Pass as [amount, coinsArray] to JS func
        inputString = `${amount}\n${coinsSize}\n${coins.join(" ")}`; // C++ format
        break;

      case "array-array-int": // e.g., Unbounded Knapsack (val[], wt[], W)
        const nItems = Math.floor(Math.random() * 10) + 1; // 1-10 items
        const maxWeight = Math.floor(Math.random() * 100) + 10; // Max weight 10-110
        const values = generateRandomArray(nItems, 1, 50); // Item values 1-50
        const weights = generateRandomArray(nItems, 1, 20); // Item weights 1-20
        inputData = [values, weights, maxWeight]; // Pass as [valArray, wtArray, W] to JS func
        inputString = `${nItems} ${maxWeight}\n${values.join(
          " "
        )}\n${weights.join(" ")}`; // C++ format
        break;

      case "int-array-int": // e.g., Stocks Max K (k, prices[])
        const kValue = Math.floor(Math.random() * 3) + 1; // k between 1 and 3
        const pricesSize = Math.floor(Math.random() * 20) + 5; // 5-24 prices
        const prices = generateRandomArray(pricesSize, 10, 100); // Prices between 10 and 100
        inputData = [kValue, prices]; // Pass as [k, pricesArray] to JS func
        inputString = `${kValue}\n${pricesSize}\n${prices.join(" ")}`; // C++ format
        break;

      default:
        // Default to array if inputType is not specified or recognized
        const defaultArrSize = Math.floor(Math.random() * 20) + 1;
        inputData = generateRandomArray(defaultArrSize, 0, 100);
        inputString = `${inputData.length}\n${inputData.join(" ")}`;
        break;
    }

    // Use the reference solution to get the correct output
    // The solve function must be able to handle the inputData format
    const expectedOutput = JSON.stringify(
      solve(...(Array.isArray(inputData) ? inputData : [inputData]))
    );

    generatedTestCases.push({
      input: inputString,
      expectedOutput,
      isEdgeCase: false,
    });
  }

  return generatedTestCases;
};
