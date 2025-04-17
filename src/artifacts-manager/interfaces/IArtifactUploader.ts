/**
 * Interface for uploading artifacts to GitHub Actions.
 *
 * This interface defines the contract for any class that implements artifact uploading functionality.
 */
export interface IArtifactUploader {
  /**
   * Uploads a file as an artifact to GitHub Actions.
   *
   * @param {string} resultFilePath - The full path to the file to be uploaded. Must be a valid file path.
   * @param {string} resultFolder - The folder containing the file to be uploaded. Must be a valid directory path.
   * @returns {Promise<void>} A promise that resolves when the artifact upload is complete.
   */
  upload(resultFilePath: string, resultFolder: string): Promise<void>
}
