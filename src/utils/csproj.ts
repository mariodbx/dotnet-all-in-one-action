import * as fs from 'fs/promises'
import { runCommand } from './command.js'

/**
 * Finds the first `.csproj` file matching the specified name within a given depth.
 *
 * @param {number} csprojDepth - The maximum depth to search for the `.csproj` file.
 * @param {string} csprojName - The name of the `.csproj` file to search for.
 * @returns {Promise<string>} A promise that resolves to the path of the `.csproj` file, or an empty string if not found.
 * @throws {Error} If the `runCommand` function fails to execute the find command.
 * @example
 * const csprojPath: string = await findCsprojFile(2, 'MyProject.csproj');
 * console.log(csprojPath); // Outputs: ./MyProject.csproj
 * @remarks
 * This function uses the `find` command, which is platform-dependent and may not work on non-Unix systems.
 */
export async function findCsprojFile(
  csprojDepth: number,
  csprojName: string
): Promise<string> {
  const findCmd = `find . -maxdepth ${csprojDepth} -name "${csprojName}" | head -n 1`
  const result = await runCommand('bash', ['-c', findCmd], {}, true)
  if (!result) {
    throw new Error(`No .csproj file found with name "${csprojName}"`)
  }
  return result
}

/**
 * Reads the content of a `.csproj` file.
 *
 * @param {string} csprojPath - The path to the `.csproj` file.
 * @returns {Promise<string>} A promise that resolves to the content of the `.csproj` file as a string.
 * @throws {Error} If the file cannot be read.
 * @example
 * const content: string = await readCsprojFile('./MyProject.csproj');
 * console.log(content); // Outputs the content of the file.
 * @remarks
 * Ensure the file exists and the path is correct before calling this function.
 */
export async function readCsprojFile(csprojPath: string): Promise<string> {
  return await fs.readFile(csprojPath, 'utf8')
}

/**
 * Updates the content of a `.csproj` file.
 *
 * @param {string} csprojPath - The path to the `.csproj` file.
 * @param {string} content - The new content to write to the `.csproj` file.
 * @returns {Promise<void>} A promise that resolves when the file has been updated.
 * @throws {Error} If the file cannot be written.
 * @example
 * await updateCsprojFile('./MyProject.csproj', '<Project>...</Project>');
 * @remarks
 * This function overwrites the file content. Ensure you have a backup if needed.
 */
export async function updateCsprojFile(
  csprojPath: string,
  content: string
): Promise<void> {
  await fs.writeFile(csprojPath, content, 'utf8')
}

/**
 * Extracts the version from the content of a `.csproj` file.
 *
 * @param {string} csprojContent - The content of the `.csproj` file as a string.
 * @returns {string} The version string extracted from the `.csproj` file.
 * @throws {Error} If no version is found in the `.csproj` file.
 * @example
 * const version: string = extractVersion('<Version>1.0.0</Version>');
 * console.log(version); // Outputs: 1.0.0
 * @remarks
 * The function assumes the version is defined in a `<Version>` tag. Ensure the `.csproj` file follows this convention.
 */
export function extractVersion(csprojContent: string): string {
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
 * @example
 * const updatedContent: string = updateVersionContent('<Version>1.0.0</Version>', '2.0.0');
 * console.log(updatedContent); // Outputs: <Version>2.0.0</Version>
 * @remarks
 * This function replaces the first occurrence of the `<Version>` tag. Ensure the content is well-formed XML.
 */
export function updateVersionContent(
  csprojContent: string,
  newVersion: string
): string {
  const versionRegex = /<Version>([^<]+)<\/Version>/
  return csprojContent.replace(versionRegex, `<Version>${newVersion}</Version>`)
}

/**
 * Extracts the version from the content of a `.csproj` file.
 *
 * @param {string} content - The content of the `.csproj` file as a string.
 * @returns {string} The version string extracted from the `.csproj` file.
 * @throws {Error} If no version is found in the `.csproj` file.
 * @example
 * const version: string = extractVersionFromCsproj('<Version>1.0.0</Version>');
 * console.log(version); // Outputs: 1.0.0
 * @remarks
 * This function is similar to `extractVersion` but may be used in different contexts for clarity.
 */
export function extractVersionFromCsproj(content: string): string {
  const match = content.match(/<Version>([^<]+)<\/Version>/)
  if (!match) throw new Error('No version found in the .csproj file.')
  return match[1].trim()
}

/**
 * Extracts the version suffix from the content of a `.csproj` file.
 *
 * @param {string} csprojContent - The content of the `.csproj` file as a string.
 * @returns {string} The version suffix string extracted from the `.csproj` file.
 * @throws {Error} If no version suffix is found in the `.csproj` file.
 * @example
 * const suffix: string = extractVersionSuffix('<VersionSuffix>beta</VersionSuffix>');
 * console.log(suffix); // Outputs: beta
 * @remarks
 * The function assumes the version suffix is defined in a `<VersionSuffix>` tag. Ensure the `.csproj` file follows this convention.
 */
export function extractVersionSuffix(csprojContent: string): string {
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
 * @example
 * const updatedContent: string = updateVersionSuffixContent('<VersionSuffix>beta</VersionSuffix>', 'rc');
 * console.log(updatedContent); // Outputs: <VersionSuffix>rc</VersionSuffix>
 * @remarks
 * This function replaces the first occurrence of the `<VersionSuffix>` tag. Ensure the content is well-formed XML.
 */
export function updateVersionSuffixContent(
  csprojContent: string,
  newSuffix: string
): string {
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
 * @example
 * const updatedContent: string = removeVersionSuffix('<VersionSuffix>beta</VersionSuffix>');
 * console.log(updatedContent); // Outputs: (removes the <VersionSuffix> tag)
 * @remarks
 * This function removes the `<VersionSuffix>` tag entirely. Ensure the content is well-formed XML.
 */
export function removeVersionSuffix(csprojContent: string): string {
  const suffixRegex = /<VersionSuffix>[^<]+<\/VersionSuffix>\s*/
  return csprojContent.replace(suffixRegex, '')
}
