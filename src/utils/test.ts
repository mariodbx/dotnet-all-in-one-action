import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import * as exec from '@actions/exec'
import { installDotnetEfLocally } from './dotnet.js'

/**
 * Executes .NET tests in a specified folder with a given configuration and uploads the test results as artifacts.
 *
 * @param {string} envName - The environment name to set for the test execution (e.g., 'Development', 'Production').
 * @param {string} testFolder - The folder containing the test project to execute.
 * @param {string} testOutputFolder - The folder where test result files will be stored.
 * @param {string} testFormat - The format for test results (e.g., 'trx', 'html', 'json'). If provided, test results will be logged to a file.
 * @param {boolean} useGlobalDotnetEf - A flag indicating whether to use the global dotnet-ef tool or install a local version.
 *
 * @returns {Promise<void>} A Promise that resolves when the test execution and artifact upload process is complete.
 *
 * @throws {Error} Throws an error if the test execution fails or if artifact upload encounters an issue.
 */
export async function tests(
  envName: string,
  testFolder: string,
  testOutputFolder: string,
  testFormat: string,
  useGlobalDotnetEf: boolean
): Promise<void> {
  core.info(`Setting DOTNET_ENVIRONMENT to "${envName}" for test execution...`)

  // Validate that the test folder exists.
  if (!fs.existsSync(testFolder)) {
    throw new Error(`Test folder does not exist: ${testFolder}`)
  }

  // Ensure dotnet-ef is available locally if the global flag is not set.
  if (!useGlobalDotnetEf) {
    core.info('Installing dotnet-ef locally...')
    try {
      await installDotnetEfLocally()
      core.info('dotnet-ef successfully installed locally.')
    } catch (error: unknown) {
      if (error instanceof Error) {
        core.error(`Failed to install dotnet-ef locally: ${error.message}`)
      } else {
        core.error(
          `Failed to install dotnet-ef locally: Unknown error occurred.`
        )
      }
      throw error instanceof Error
        ? error
        : new Error('Unknown error during dotnet-ef installation.')
    }
  }

  // Set the environment variable for the dotnet test command.
  process.env.DOTNET_ENVIRONMENT = envName

  core.info(`Running tests in folder: ${testFolder}...`)

  // Initialize the arguments for the dotnet test command.
  const args = ['test', testFolder, '--verbosity', 'detailed']

  // Determine the output result file path if a test format is provided.
  const resolvedOutputFolder = path.resolve(testOutputFolder)
  let resultFilePath = ''

  if (testFormat) {
    // Construct the test result file's full path.
    const resultFileName = `TestResults.${testFormat}`
    resultFilePath = path.join(resolvedOutputFolder, resultFileName)

    // Ensure the output directory exists.
    fs.mkdirSync(resolvedOutputFolder, { recursive: true })

    // Append logger parameters to the dotnet test arguments.
    args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`)
  }

  let testExecError: Error | undefined

  try {
    // Execute the dotnet test command.
    core.info(`Executing command: dotnet ${args.join(' ')}`)
    const { stdout, stderr, exitCode } = await exec.getExecOutput(
      'dotnet',
      args
    )

    // Print outputs for debugging purposes.
    core.info(stdout)
    if (stderr) {
      core.warning(stderr)
    }

    // If the command did not complete successfully, capture and report the exit code.
    if (exitCode !== 0) {
      throw new Error(`dotnet test failed with exit code ${exitCode}`)
    }

    core.info('Tests completed successfully.')
  } catch (error: unknown) {
    testExecError =
      error instanceof Error
        ? error
        : new Error('Unknown error during test execution.')
    if (testExecError instanceof Error) {
      core.error(
        `Test execution encountered an error: ${testExecError.message}`
      )
    } else {
      core.error(`Test execution encountered an unknown error.`)
    }
  }

  // If an error occurred during test execution, throw it to mark the action as failed.
  if (testExecError) {
    throw testExecError
  }
}
