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

/**
 * Pulls the latest changes from the remote repository.
 *
 * @returns {Promise<void>} A promise that resolves when the pull is complete.
 * @throws {Error} If the Git pull command fails.
 */
export async function gitPull(): Promise<void> {
  const result = await exec.getExecOutput('git', ['pull'])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to pull changes: ${result.stderr}`)
  }
}

/**
 * Pushes the local changes to the remote repository.
 *
 * @returns {Promise<void>} A promise that resolves when the push is complete.
 * @throws {Error} If the Git push command fails.
 */
export async function gitPush(): Promise<void> {
  const result = await exec.getExecOutput('git', ['push'])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to push changes: ${result.stderr}`)
  }
}

/**
 * Restores the specified file or files to their last committed state.
 *
 * @param {string | string[]} paths - The file or files to restore.
 * @returns {Promise<void>} A promise that resolves when the restore is complete.
 * @throws {Error} If the Git restore command fails.
 */
export async function gitRestore(paths: string | string[]): Promise<void> {
  const files = Array.isArray(paths) ? paths : [paths]
  const result = await exec.getExecOutput('git', ['restore', ...files])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to restore files: ${result.stderr}`)
  }
}

/**
 * Commits staged changes with a specified commit message.
 *
 * @param {string} message - The commit message to use.
 * @returns {Promise<void>} A promise that resolves when the commit is complete.
 * @throws {Error} If the Git commit command fails.
 * @example
 * await gitCommit("Initial commit");
 */
export async function gitCommit(message: string): Promise<void> {
  const result = await exec.getExecOutput('git', ['commit', '-m', message])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to commit changes: ${result.stderr}`)
  }
}

/**
 * Checks the current status of the Git repository.
 *
 * @returns {Promise<string>} The output of the `git status` command.
 * @throws {Error} If the Git status command fails.
 * @example
 * const status = await gitStatus();
 * console.log(status);
 */
export async function gitStatus(): Promise<string> {
  const result = await exec.getExecOutput('git', ['status', '--short'])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to retrieve Git status: ${result.stderr}`)
  }
  return result.stdout.trim()
}

/**
 * Creates a new branch and switches to it.
 *
 * @param {string} branchName - The name of the new branch.
 * @returns {Promise<void>} A promise that resolves when the branch is created and switched to.
 * @throws {Error} If the Git branch or checkout command fails.
 * @example
 * await gitCreateAndSwitchBranch("feature/new-feature");
 */
export async function gitCreateAndSwitchBranch(
  branchName: string
): Promise<void> {
  const result = await exec.getExecOutput('git', ['checkout', '-b', branchName])
  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to create and switch to branch '${branchName}': ${result.stderr}`
    )
  }
}

/**
 * Deletes a local branch.
 *
 * @param {string} branchName - The name of the branch to delete.
 * @returns {Promise<void>} A promise that resolves when the branch is deleted.
 * @throws {Error} If the Git branch delete command fails.
 * @example
 * await gitDeleteBranch("feature/old-feature");
 */
export async function gitDeleteBranch(branchName: string): Promise<void> {
  const result = await exec.getExecOutput('git', ['branch', '-d', branchName])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to delete branch '${branchName}': ${result.stderr}`)
  }
}

/**
 * Fetches updates from the remote repository.
 *
 * @returns {Promise<void>} A promise that resolves when the fetch is complete.
 * @throws {Error} If the Git fetch command fails.
 * @example
 * await gitFetch();
 */
export async function gitFetch(): Promise<void> {
  const result = await exec.getExecOutput('git', ['fetch'])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to fetch updates: ${result.stderr}`)
  }
}

/**
 * Merges a specified branch into the current branch.
 *
 * @param {string} branchName - The name of the branch to merge.
 * @returns {Promise<void>} A promise that resolves when the merge is complete.
 * @throws {Error} If the Git merge command fails.
 * @example
 * await gitMerge("feature/new-feature");
 */
export async function gitMerge(branchName: string): Promise<void> {
  const result = await exec.getExecOutput('git', ['merge', branchName])
  if (result.exitCode !== 0) {
    throw new Error(`Failed to merge branch '${branchName}': ${result.stderr}`)
  }
}

/**
 * Resets the repository to a specific commit.
 *
 * @param {string} commitHash - The hash of the commit to reset to.
 * @param {boolean} hard - Whether to perform a hard reset (default: false).
 * @returns {Promise<void>} A promise that resolves when the reset is complete.
 * @throws {Error} If the Git reset command fails.
 * @example
 * await gitReset("abc123", true);
 */
export async function gitReset(
  commitHash: string,
  hard: boolean = false
): Promise<void> {
  const args = ['reset', hard ? '--hard' : '--soft', commitHash]
  const result = await exec.getExecOutput('git', args)
  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to reset to commit '${commitHash}': ${result.stderr}`
    )
  }
}
