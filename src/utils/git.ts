import * as exec from '@actions/exec'

/**
 * Retrieves the latest commit subject.
 *
 * @returns {Promise<string>} The latest commit subject as a string.
 * @throws {Error} If the Git command fails.
 * @example
 * const subject: string = await getLatestCommitSubject();
 * console.log(subject);
 * @remarks
 * This function executes a Git command to retrieve the latest commit subject.
 * Ensure that the repository is initialized and contains at least one commit.
 */
export async function getLatestCommitSubject(): Promise<string> {
  const result = await exec.getExecOutput('git', [
    'log',
    '-1',
    '--pretty=format:%s'
  ])
  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to retrieve the latest commit subject: ${result.stderr}`
    )
  }
  return result.stdout.trim()
}

/**
 * Retrieves the latest commit message from the Git repository.
 *
 * @returns {Promise<string>} The latest commit message.
 * @throws {Error} If the command fails or the output is empty.
 */
export async function getLatestCommitMessage(): Promise<string> {
  const { stdout } = await exec.getExecOutput('git', [
    'log',
    '-1',
    '--pretty=%B'
  ])
  return stdout.trim()
}

/**
 * Extracts version from a commit message in the format "bump version to x.x.x.x".
 *
 * @param {string} commitMessage - The commit message to extract the version from.
 * @returns {string | null} The extracted version as a string, or null if no version is found.
 * @example
 * const version: string | null = extractVersionFromCommit("bump version to 1.2.3.4");
 * console.log(version); // "1.2.3.4"
 * @remarks
 * This function uses a regular expression to extract the version number.
 * The expected format is "bump version to x.x.x.x", where x is a digit.
 */
export function extractVersionFromCommit(commitMessage: string): string | null {
  const match = commitMessage.match(/bump version to (\d+\.\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

/**
 * Updates the Git repository with a new version.
 *
 * @param {string} newVersion - The new version to set.
 * @param {string} csprojPath - The path to the .csproj file to add to the commit.
 * @param {string} commitUser - The Git username for the commit.
 * @param {string} commitEmail - The Git email for the commit.
 * @param {string} commitMessagePrefix - The prefix for the commit message.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws {Error} If any Git command fails.
 * @example
 * await updateGit(
 *   "1.2.3.4",
 *   "path/to/project.csproj",
 *   "user",
 *   "email@example.com",
 *   "Bump version to "
 * );
 * @remarks
 * This function performs the following steps:
 * 1. Configures the Git username and email.
 * 2. Stages the specified .csproj file.
 * 3. Commits the changes with the provided message.
 * 4. Pushes the commit to the remote repository.
 * Ensure that the repository is initialized, and the user has push permissions.
 */
export async function updateGit(
  newVersion: string,
  csprojPath: string,
  commitUser: string,
  commitEmail: string,
  commitMessagePrefix: string
): Promise<void> {
  await exec.exec('git', ['config', 'user.name', commitUser])
  await exec.exec('git', ['config', 'user.email', commitEmail])
  await exec.exec('git', ['add', csprojPath])
  const commitMessageFinal = `${commitMessagePrefix}${newVersion}`
  await exec.exec('git', ['commit', '-m', commitMessageFinal])
  await exec.exec('git', ['push'])
}
