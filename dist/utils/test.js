import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as artifact from '@actions/artifact';
import * as path from 'path';
import * as fs from 'fs';
/**
 * Runs tests in the specified test folder with the given configuration and uploads test artifacts.
 * The artifact is always uploaded, regardless of whether the tests pass or fail.
 *
 * @param getExecOutput - If true, capture the execution output instead of streaming it.
 * @param envName - The name of the environment to set for the test execution (e.g., 'Development', 'Production').
 * @param testFolder - The folder containing the test project.
 * @param testOutputFolder - The folder where test result files will be stored.
 * @param testFormat - Format for test results (e.g., trx, html, json). If provided, test results will be logged to a file.
 *
 * @returns A Promise that resolves when test execution and artifact upload complete.
 *
 * @example
 * ```ts
 * await runTests(
 *   true,                   // Capture output mode
 *   'Development',          // Environment name
 *   './tests/MyTestProject',// Test folder
 *   './output',             // Test output folder
 *   'trx'                   // Test result format (e.g., trx, html, json)
 * )
 * ```
 */
export async function runTests(getExecOutput, envName, testFolder, testOutputFolder, testFormat) {
    core.info(`Setting environment to ${envName} for test execution...`);
    // Set the DOTNET_ENVIRONMENT variable for the test run
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
        // Run the tests using the specified method to capture or stream output
        if (getExecOutput) {
            const result = await exec.getExecOutput('dotnet', args);
            core.info(result.stdout);
            if (result.exitCode !== 0) {
                throw new Error(`Test execution failed with exit code ${result.exitCode}`);
            }
        }
        else {
            const exitCode = await exec.exec('dotnet', args);
            if (exitCode !== 0) {
                throw new Error(`Test execution failed with exit code ${exitCode}`);
            }
        }
        core.info('Tests completed successfully.');
    }
    catch (error) {
        // Capture the test error but do not rethrow immediately, to allow artifact upload
        if (error instanceof Error) {
            testExecError = error;
            core.error(`Test execution encountered an error: ${error.message}`);
        }
        else {
            testExecError = new Error('Test execution failed due to an unknown error.');
            core.error('Test execution failed due to an unknown error.');
        }
    }
    finally {
        // Always attempt to upload the test artifacts if a result file was generated.
        if (resultFilePath) {
            core.info(`Looking for test result file at ${resultFilePath}...`);
            const artifactClient = new artifact.DefaultArtifactClient();
            try {
                const { id, size } = await artifactClient.uploadArtifact('test-results', // Artifact name
                [resultFilePath], // List of files to upload
                resultFolder, // Folder containing the result file
                { retentionDays: 7 } // Set retention days for the artifact
                );
                core.info(`Created artifact with id: ${id} (bytes: ${size})`);
            }
            catch (uploadError) {
                if (uploadError instanceof Error) {
                    core.error(`Failed to upload test results: ${uploadError.message}`);
                }
                else {
                    core.error('Failed to upload test results due to an unknown error.');
                }
            }
        }
    }
    // If there was an error during test execution, throw it now to mark the action as failed.
    if (testExecError) {
        throw testExecError;
    }
}
// Example usage:
// (async () => {
//   try {
//     await runTests(
//       true,                   // getExecOutput
//       'Development',          // envName
//       './tests/MyTestProject',// testFolder
//       './output',             // testOutputFolder
//       'trx'                   // testFormat
//     )
//   } catch (error) {
//     core.error(`Error running tests: ${error}`)
//     process.exit(1)
//   }
// })()
