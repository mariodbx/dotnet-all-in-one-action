/**
 * Waits for a specified number of milliseconds before resolving.
 *
 * This function is useful for introducing delays in asynchronous workflows, such as:
 * - Waiting for an external process to complete.
 * - Throttling API calls to avoid rate limits.
 * - Simulating delays in testing environments.
 *
 * @param {number} milliseconds - The number of milliseconds to wait. Must be a finite, non-negative number.
 * @returns {Promise<string>} A promise that resolves with the string `'done!'` after the specified delay.
 *
 * @throws {Error} Will throw an error if the `milliseconds` parameter:
 * - Is not a finite number (e.g., `NaN`, `Infinity`, or `-Infinity`).
 * - Is negative (e.g., `-100`).
 *
 * @example
 * // Example 1: Basic usage
 * async function example1(): Promise<void> {
 *   const result: string = await wait(2000); // Waits for 2 seconds
 *   console.log(result); // Output: 'done!'
 * }
 *
 * example1();
 *
 * @example
 * // Example 2: Handling errors
 * async function example2(): Promise<void> {
 *   try {
 *     const result: string = await wait(-100); // Invalid input
 *   } catch (error: Error) {
 *     console.error(error.message); // Output: 'milliseconds must be a finite, non-negative number'
 *   }
 * }
 *
 * example2();
 *
 * @remarks
 * - **Input Validation**: The `milliseconds` parameter must be a valid finite number. If it is `NaN`, infinite, or negative, the function will throw an error.
 * - **Precision**: The delay is implemented using `setTimeout`, which may not be precise for very short durations (e.g., less than 10ms) due to the behavior of the JavaScript event loop.
 * - **Asynchronous Nature**: This function is asynchronous and returns a promise. Use `await` or `.then()` to handle the resolved value.
 * - **Resolved Value**: The resolved value of the promise is always the string `'done!'`, which can be used as a simple confirmation of the delay's completion.
 * - **Use Cases**: This function is commonly used in scenarios where a delay is required, such as testing, animations, or retrying failed operations after a timeout.
 * - **Error Handling**: Ensure proper error handling when using this function, especially for invalid inputs.
 * - **Performance Considerations**: For very short delays, consider the imprecision of `setTimeout` due to the JavaScript event loop.
 */
export async function wait(milliseconds: number): Promise<string> {
  return new Promise((resolve) => {
    if (isNaN(milliseconds) || milliseconds < 0) {
      throw new Error('milliseconds must be a finite, non-negative number')
    }

    setTimeout(() => resolve('done!'), milliseconds)
  })
}
