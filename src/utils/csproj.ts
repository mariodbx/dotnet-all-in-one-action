import * as fs from 'fs/promises'
import * as exec from '@actions/exec'

/**
 * Interface for managing `.csproj` files.
 */
export interface ICsprojManager {
  findCsprojFile(csprojDepth: number, csprojName: string): Promise<string>
  readCsprojFile(csprojPath: string): Promise<string>
  updateCsprojFile(csprojPath: string, content: string): Promise<void>
  extractVersion(csprojContent: string): string
  updateVersionContent(csprojContent: string, newVersion: string): string
  extractVersionSuffix(csprojContent: string): string
  updateVersionSuffixContent(csprojContent: string, newSuffix: string): string
  removeVersionSuffix(csprojContent: string): string
}

/**
 * Class for managing `.csproj` files.
 */
export class CsprojManager implements ICsprojManager {
  /**
   * Finds the first `.csproj` file matching the specified name within a given depth.
   *
   * @param {number} csprojDepth - The maximum depth to search for the `.csproj` file.
   * @param {string} csprojName - The name of the `.csproj` file to search for.
   * @returns {Promise<string>} A promise that resolves to the path of the `.csproj` file, or an empty string if not found.
   * @throws {Error} If the `getExecOutput` function fails to execute the find command.
   */
  async findCsprojFile(
    csprojDepth: number,
    csprojName: string
  ): Promise<string> {
    const findCmd = `find . -maxdepth ${csprojDepth} -name "${csprojName}" | head -n 1`
    const result = await exec.getExecOutput('bash', ['-c', findCmd])
    if (result.exitCode !== 0 || !result.stdout.trim()) {
      throw new Error(`No .csproj file found with name "${csprojName}"`)
    }
    return result.stdout.trim()
  }

  /**
   * Reads the content of a `.csproj` file.
   *
   * @param {string} csprojPath - The path to the `.csproj` file.
   * @returns {Promise<string>} A promise that resolves to the content of the `.csproj` file as a string.
   * @throws {Error} If the file cannot be read.
   */
  async readCsprojFile(csprojPath: string): Promise<string> {
    return await fs.readFile(csprojPath, 'utf8')
  }

  /**
   * Updates the content of a `.csproj` file.
   *
   * @param {string} csprojPath - The path to the `.csproj` file.
   * @param {string} content - The new content to write to the `.csproj` file.
   * @returns {Promise<void>} A promise that resolves when the file has been updated.
   * @throws {Error} If the file cannot be written.
   */
  async updateCsprojFile(csprojPath: string, content: string): Promise<void> {
    await fs.writeFile(csprojPath, content, 'utf8')
  }

  /**
   * Extracts the version from the content of a `.csproj` file.
   *
   * @param {string} csprojContent - The content of the `.csproj` file as a string.
   * @returns {string} The version string extracted from the `.csproj` file.
   * @throws {Error} If no version is found in the `.csproj` file.
   */
  extractVersion(csprojContent: string): string {
    const versionRegex = /<Version>([^<]+)<\/Version>/
    const match = csprojContent.match(versionRegex)
    if (!match) {
      throw new Error('No version found in csproj file.')
    }
    return match[1].trim()
  }

  /**
   * Updates the version in the content of a `.csproj` file.
   *
   * @param {string} csprojContent - The content of the `.csproj` file as a string.
   * @param {string} newVersion - The new version to set in the `.csproj` file.
   * @returns {string} The updated content of the `.csproj` file with the new version.
   */
  updateVersionContent(csprojContent: string, newVersion: string): string {
    const versionRegex = /<Version>([^<]+)<\/Version>/
    return csprojContent.replace(
      versionRegex,
      `<Version>${newVersion}</Version>`
    )
  }

  /**
   * Extracts the version suffix from the content of a `.csproj` file.
   *
   * @param {string} csprojContent - The content of the `.csproj` file as a string.
   * @returns {string} The version suffix string extracted from the `.csproj` file.
   * @throws {Error} If no version suffix is found in the `.csproj` file.
   */
  extractVersionSuffix(csprojContent: string): string {
    const suffixRegex = /<VersionSuffix>([^<]+)<\/VersionSuffix>/
    const match = csprojContent.match(suffixRegex)
    if (!match) {
      throw new Error('No version suffix found in csproj file.')
    }
    return match[1].trim()
  }

  /**
   * Updates the version suffix in the content of a `.csproj` file.
   *
   * @param {string} csprojContent - The content of the `.csproj` file as a string.
   * @param {string} newSuffix - The new version suffix to set in the `.csproj` file.
   * @returns {string} The updated content of the `.csproj` file with the new version suffix.
   */
  updateVersionSuffixContent(csprojContent: string, newSuffix: string): string {
    const suffixRegex = /<VersionSuffix>([^<]+)<\/VersionSuffix>/
    return csprojContent.replace(
      suffixRegex,
      `<VersionSuffix>${newSuffix}</VersionSuffix>`
    )
  }

  /**
   * Removes the version suffix from the content of a `.csproj` file.
   *
   * @param {string} csprojContent - The content of the `.csproj` file as a string.
   * @returns {string} The updated content of the `.csproj` file without the version suffix.
   */
  removeVersionSuffix(csprojContent: string): string {
    const suffixRegex = /<VersionSuffix>[^<]+<\/VersionSuffix>\s*/
    return csprojContent.replace(suffixRegex, '')
  }
}
