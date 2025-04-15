import * as core from '@actions/core';
import { runCommand } from './command.js';
/**
 * Retrieves the latest commit subject.
 *
 * @param {boolean} showFullOutput - If true, returns the full output of the command; otherwise, returns only the exit code.
 * @returns {Promise<string>} The latest commit subject as a string.
 * @throws {Error} If the Git command fails.
 * @example
 * const subject: string = await getLatestCommitSubject(true);
 * console.log(subject);
 * @remarks
 * This function executes a Git command to retrieve the latest commit subject.
 * Ensure that the repository is initialized and contains at least one commit.
 */
export async function getLatestCommitSubject(showFullOutput) {
    return await runCommand('git', ['log', '-1', '--pretty=format:%s'], {}, showFullOutput);
}
/**
 * Retrieves the latest commit message from the Git repository.
 *
 * @param {boolean} showFullOutput - If true, logs the full output of the command.
 * @returns {Promise<string>} The latest commit message.
 * @throws {Error} If the command fails or the output is empty.
 */
export async function getLatestCommitMessage(showFullOutput) {
    try {
        const result = await runCommand('git', ['log', '-1', '--pretty=%B'], {}, showFullOutput);
        const trimmedResult = result.trim();
        if (!trimmedResult) {
            core.warning('Git log returned empty or whitespace-only output. Ensure the repository has valid commits.');
            throw new Error('Failed to retrieve the latest commit message. Output is empty or invalid.');
        }
        return trimmedResult;
    }
    catch (error) {
        core.error('Error executing git log command.');
        throw error;
    }
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
export function extractVersionFromCommit(commitMessage) {
    const match = commitMessage.match(/bump version to (\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
}
/**
 * Updates the Git repository with a new version.
 *
 * @param {string} newVersion - The new version to set.
 * @param {string} csprojPath - The path to the .csproj file to add to the commit.
 * @param {string} commitUser - The Git username for the commit.
 * @param {string} commitEmail - The Git email for the commit.
 * @param {string} commitMessagePrefix - The prefix for the commit message.
 * @param {boolean} showFullOutput - If true, shows the full output of Git commands; otherwise, only executes them.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws {Error} If any Git command fails.
 * @example
 * await updateGit(
 *   "1.2.3.4",
 *   "path/to/project.csproj",
 *   "user",
 *   "email@example.com",
 *   "Bump version to ",
 *   true
 * );
 * @remarks
 * This function performs the following steps:
 * 1. Configures the Git username and email.
 * 2. Stages the specified .csproj file.
 * 3. Commits the changes with the provided message.
 * 4. Pushes the commit to the remote repository.
 * Ensure that the repository is initialized, and the user has push permissions.
 */
export async function updateGit(newVersion, csprojPath, commitUser, commitEmail, commitMessagePrefix, showFullOutput) {
    await runCommand('git', ['config', 'user.name', commitUser], {}, showFullOutput);
    await runCommand('git', ['config', 'user.email', commitEmail], {}, showFullOutput);
    await runCommand('git', ['add', csprojPath], {}, showFullOutput);
    const commitMessageFinal = `${commitMessagePrefix}${newVersion}`;
    await runCommand('git', ['commit', '-m', commitMessageFinal], {}, showFullOutput);
    await runCommand('git', ['push'], {}, showFullOutput);
    core.info(`Committed and pushed version update: "${commitMessageFinal}"`);
}
