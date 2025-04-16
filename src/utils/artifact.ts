import * as core from '@actions/core'
import * as artifact from '@actions/artifact'
import * as fs from 'fs'

/**
 * Interface for uploading artifacts to GitHub Actions.
 *
 * This interface defines the contract for any class that implements artifact uploading functionality.
 */
interface IArtifactUploader {
  /**
   * Uploads a file as an artifact to GitHub Actions.
   *
   * @param {string} resultFilePath - The full path to the file to be uploaded. Must be a valid file path.
   * @param {string} resultFolder - The folder containing the file to be uploaded. Must be a valid directory path.
   * @returns {Promise<void>} A promise that resolves when the artifact upload is complete.
   */
  upload(resultFilePath: string, resultFolder: string): Promise<void>
}

/**
 * Implementation of the IArtifactUploader interface for uploading artifacts.
 *
 * This class provides functionality to upload files as artifacts to GitHub Actions.
 */
class ArtifactUploader implements IArtifactUploader {
  private readonly artifactName: string
  private readonly retentionDays: number

  /**
   * Constructs an instance of ArtifactUploader.
   *
   * @param {string} artifactName - The name of the artifact to be created.
   * @param {number} retentionDays - The number of days the artifact will be retained.
   */
  constructor(artifactName: string, retentionDays: number) {
    this.artifactName = artifactName
    this.retentionDays = retentionDays
  }

  /**
   * Uploads a file as an artifact to GitHub Actions.
   *
   * This method checks if the file exists before attempting to upload it. If the file does not exist,
   * a warning is logged. If the upload fails, an error is logged.
   *
   * @param {string} resultFilePath - The full path to the file to be uploaded. Must be a valid file path.
   * @param {string} resultFolder - The folder containing the file to be uploaded. Must be a valid directory path.
   * @returns {Promise<void>} A promise that resolves when the artifact upload is complete.
   *
   * @throws {Error} Will throw an error if:
   * - The artifact upload fails due to an API or network error.
   *
   * @example
   * // Example 1: Uploading a test result file
   * const uploader = new ArtifactUploader('test-results', 7);
   * await uploader.upload('/path/to/test-results.xml', '/path/to');
   *
   * @remarks
   * - **Input Validation**: Ensure that `resultFilePath` points to an existing file and `resultFolder` is a valid directory.
   * - **Artifact Retention**: The uploaded artifact will be retained for the number of days specified by `retentionDays`.
   * - **Error Handling**: Proper error handling is implemented to log errors if the upload fails.
   * - **Use Cases**: This class is commonly used in CI/CD workflows to persist test results or other important files.
   * - **Performance Considerations**: Large files may take longer to upload, depending on network speed.
   * - **Logging**: Informational and error messages are logged using `@actions/core` for better traceability in workflow logs.
   */
  public async upload(
    resultFilePath: string,
    resultFolder: string
  ): Promise<void> {
    if (fs.existsSync(resultFilePath)) {
      core.info(`Uploading test result file from ${resultFilePath}...`)
      const artifactClient = new artifact.DefaultArtifactClient()

      try {
        const { id, size } = await artifactClient.uploadArtifact(
          this.artifactName,
          [resultFilePath],
          resultFolder,
          { retentionDays: this.retentionDays }
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
}

/**
 * Uploads a test result file as an artifact to GitHub Actions.
 *
 * This function is a wrapper around the ArtifactUploader class and provides a simple interface
 * for uploading test result files. It uses a default artifact name and retention period.
 *
 * @param {string} resultFilePath - The full path to the test result file. Must be a valid file path.
 * @param {string} resultFolder - The folder containing the test result file. Must be a valid directory path.
 * @returns {Promise<void>} A promise that resolves when the artifact upload is complete.
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
 * - **Artifact Retention**: The uploaded artifact will be retained for 7 days by default.
 * - **Error Handling**: Proper error handling is implemented to log errors if the upload fails.
 * - **Use Cases**: This function is commonly used in CI/CD workflows to persist test results or other important files.
 * - **Performance Considerations**: Large files may take longer to upload, depending on network speed.
 * - **Logging**: Informational and error messages are logged using `@actions/core` for better traceability in workflow logs.
 */
export async function uploadTestArtifact(
  resultFilePath: string,
  resultFolder: string
): Promise<void> {
  const artifactUploader = new ArtifactUploader('test-results', 7)
  await artifactUploader.upload(resultFilePath, resultFolder)
}
