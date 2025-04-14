import * as exec from '@actions/exec'

/**
 * Executes a shell command using GitHub Actions' exec module.
 *
 * @param {string} command - The command to execute.
 * @param {string[]} [args=[]] - An array of arguments to pass to the command.
 * @param {exec.ExecOptions} [options={}] - Optional execution options.
 * @param {boolean} [showFullOutput=false] - A boolean flag indicating whether to return the full output.
 * @returns {Promise<string>} A promise that resolves to the trimmed stdout if `showFullOutput` is true, otherwise resolves to an empty string.
 * @throws {Error} If the command execution fails.
 *
 * @example
 * // Example with full output
 * const output: string = await runCommand('echo', ['Hello, world!'], {}, true);
 * console.log(output); // Outputs: Hello, world!
 *
 * @example
 * // Example without full output
 * await runCommand('echo', ['Hello, world!'], {}, false);
 *
 * @remarks
 * - The `command` parameter must be a valid executable available in the system's PATH.
 * - If `showFullOutput` is true, the function captures and trims the stdout of the command.
 * - If `showFullOutput` is false, the function executes the command without returning any output.
 * - Errors during execution will throw an exception, which should be handled by the caller.
 * - Use this function for executing shell commands in GitHub Actions workflows.
 */
export async function runCommand(
  command: string,
  args: string[] = [],
  options: exec.ExecOptions = {},
  showFullOutput: boolean = false
): Promise<string> {
  if (showFullOutput) {
    const result = await exec.getExecOutput(command, args, options)
    return result.stdout.trim()
  } else {
    await exec.exec(command, args, options)
    return ''
  }
}
