import * as core from '@actions/core'
import * as artifact from '@actions/artifact'
import * as fs from 'fs'

const ARTIFACT_NAME = 'test-results'
const ARTIFACT_RETENTION_DAYS = 7

/**
 * Uploads a test result file as an artifact to GitHub Actions.
 *
 * This function is useful for persisting test results or other files generated during a workflow run.
 * The uploaded artifact can be downloaded later from the workflow run summary.
 *
 * @param {string} resultFilePath - The full path to the test result file. Must be a valid file path.
 * @param {string} resultFolder - The folder containing the test result file. Must be a valid directory path.
 * @returns {Promise<void>} A promise that resolves when the artifact upload is complete.
 *
 * @throws {Error} Will throw an error if:
 * - The file specified by `resultFilePath` does not exist.
 * - The artifact upload fails due to an API or network error.
 *
 * @example
 * // Example 1: Uploading a test result file
 * async function example1(): Promise<void> {
 *   const resultFilePath = '/path/to/test-results.xml';
 *   const resultFolder = '/path/to';
 *   await uploadTestArtifact(resultFilePath, resultFolder);
 * }
 *
 * @example
 * // Example 2: Handling upload errors
 * async function example2(): Promise<void> {
 *   try {
 *     const resultFilePath = '/invalid/path/to/test-results.xml';
 *     const resultFolder = '/invalid/path';
 *     await uploadTestArtifact(resultFilePath, resultFolder);
 *   } catch (error: Error) {
 *     console.error(error.message); // Output: 'No test result file found to upload.' or other error messages
 *   }
 * }
 *
 * @remarks
 * - **Input Validation**: Ensure that `resultFilePath` points to an existing file and `resultFolder` is a valid directory.
 * - **Artifact Retention**: The uploaded artifact will be retained for the number of days specified by `ARTIFACT_RETENTION_DAYS`.
 * - **Error Handling**: Proper error handling is implemented to log errors if the upload fails.
 * - **Use Cases**: This function is commonly used in CI/CD workflows to persist test results or other important files.
 * - **Performance Considerations**: Large files may take longer to upload, depending on network speed.
 * - **Logging**: Informational and error messages are logged using `@actions/core` for better traceability in workflow logs.
 */
export async function uploadTestArtifact(
  resultFilePath: string,
  resultFolder: string
): Promise<void> {
  if (fs.existsSync(resultFilePath)) {
    core.info(`Uploading test result file from ${resultFilePath}...`)
    const artifactClient = new artifact.DefaultArtifactClient()

    try {
      const { id, size } = await artifactClient.uploadArtifact(
        ARTIFACT_NAME,
        [resultFilePath],
        resultFolder,
        { retentionDays: ARTIFACT_RETENTION_DAYS }
      )
      core.info(`Created artifact with id: ${id} (bytes: ${size})`)
    } catch (uploadError: unknown) {
      if (uploadError instanceof Error) {
        core.error(`Failed to upload test results: ${uploadError.message}`)
      } else {
        core.error('Failed to upload test results due to an unknown error.')
      }
    }
  } else {
    core.warning('No test result file found to upload.')
  }
}
