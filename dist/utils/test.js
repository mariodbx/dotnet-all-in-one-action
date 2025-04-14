import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import * as path from 'path';
import * as fs from 'fs';
import { runCommand } from './command.js';
import { installDotnetEfLocally } from './dotnetEfInstaller.js';
const ARTIFACT_NAME = 'test-results';
const ARTIFACT_RETENTION_DAYS = 7;
/**
 * Utility function to handle errors and log them appropriately.
 * @param {unknown} error - The error to handle.
 * @param {string} message - Custom error message to log.
 */
function logError(error, message) {
    if (error instanceof Error) {
        core.error(`${message}: ${error.message}`);
    }
    else {
        core.error(`${message}: Unknown error occurred.`);
    }
}
/**
 * Executes .NET tests in a specified folder with a given configuration and uploads the test results as artifacts.
 * The function ensures that test artifacts are uploaded regardless of whether the tests pass or fail.
 *
 * @param {boolean} getExecOutput - A flag indicating whether to capture the execution output instead of streaming it.
 * @param {string} envName - The environment name to set for the test execution (e.g., 'Development', 'Production').
 * @param {string} testFolder - The folder containing the test project to execute.
 * @param {string} testOutputFolder - The folder where test result files will be stored.
 * @param {string} testFormat - The format for test results (e.g., 'trx', 'html', 'json'). If provided, test results will be logged to a file.
 * @param {boolean} useGlobalDotnetEf - A flag indicating whether to use the global dotnet-ef tool or install a local version.
 *
 * @returns {Promise<void>} A Promise that resolves when the test execution and artifact upload process is complete.
 *
 * @throws {Error} Throws an error if the test execution fails or if artifact upload encounters an issue.
 *
 * @example
 * ```typescript
 * import { tests } from './utils/test.js';
 *
 * (async () => {
 *   try {
 *     await tests(
 *       true,                   // Capture output mode
 *       'Development',          // Environment name
 *       './tests/MyTestProject',// Test folder
 *       './output',             // Test output folder
 *       'trx',                  // Test result format (e.g., trx, html, json)
 *       false                   // Use global dotnet-ef tool
 *     );
 *   } catch (error) {
 *     console.error(`Error running tests: ${error.message}`);
 *     process.exit(1);
 *   }
 * })();
 * ```
 *
 * @remarks
 * - The `DOTNET_ENVIRONMENT` environment variable is set to the value of `envName` during the test execution.
 * - If `testFormat` is provided, the test results are logged to a file in the specified format and stored in the `testOutputFolder`.
 * - The function ensures that the test output directory exists before running the tests.
 * - Test artifacts are uploaded using the `@actions/artifact` package, and the artifact retention period is set to 7 days.
 * - If an error occurs during test execution, it is captured and rethrown after the artifact upload process to ensure the action fails appropriately.
 * - The `runCommand` function is used to execute the `dotnet test` command with the specified arguments.
 * - This function is asynchronous and should be awaited to ensure proper error handling and artifact upload.
 */
export async function tests(getExecOutput, envName, testFolder, testOutputFolder, testFormat, useGlobalDotnetEf) {
    core.info(`Setting environment to ${envName} for test execution...`);
    // Ensure dotnet-ef is available if not using the global version
    if (!useGlobalDotnetEf) {
        await installDotnetEfLocally();
    } // Set the DOTNET_ENVIRONMENT variable for the test run
    process.env.DOTNET_ENVIRONMENT = envName;
    core.info(`Running tests in ${testFolder}...`);
    // Create command arguments with detailed verbosity
    const args = ['test', testFolder, '--verbosity', 'detailed'];
    // Resolve the test output folder
    const resultFolder = path.resolve(testOutputFolder);
    let resultFilePath = '';
    if (testFormat) {
        // Build the result file name and resolve full path
        const resultFileName = `TestResults.${testFormat}`;
        resultFilePath = path.join(resultFolder, resultFileName);
        // Ensure that the test output directory exists
        fs.mkdirSync(resultFolder, { recursive: true });
        // Add logging parameter to the test command so that results are output to a file
        args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`);
    }
    let testExecError = undefined;
    try {
        // Run the tests using the centralized runCommand function
        const result = await runCommand('dotnet', args, {}, getExecOutput);
        if (getExecOutput) {
            core.info(result);
        }
        core.info('Tests completed successfully.');
    }
    catch (error) {
        // Capture the test error but do not rethrow immediately, to allow artifact upload
        testExecError =
            error instanceof Error
                ? error
                : new Error('Unknown test execution error.');
        logError(testExecError, 'Test execution encountered an error');
    }
    finally {
        // Always attempt to upload the test artifacts if a result file was generated.
        if (resultFilePath && fs.existsSync(resultFilePath)) {
            core.info(`Uploading test result file from ${resultFilePath}...`);
            const artifactClient = new artifact.DefaultArtifactClient();
            try {
                const { id, size } = await artifactClient.uploadArtifact(ARTIFACT_NAME, [resultFilePath], resultFolder, { retentionDays: ARTIFACT_RETENTION_DAYS });
                core.info(`Created artifact with id: ${id} (bytes: ${size})`);
            }
            catch (uploadError) {
                logError(uploadError, 'Failed to upload test results');
            }
        }
        else {
            core.warning('No test result file found to upload.');
        }
    }
    // If there was an error during test execution, throw it now to mark the action as failed.
    if (testExecError) {
        throw testExecError;
    }
}
