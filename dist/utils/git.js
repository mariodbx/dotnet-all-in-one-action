import * as core from '@actions/core';
import { execWithOutput } from './exec.js';
/**
 * Retrieves the latest commit subject.
 *
 * @example
 * const subject = await getLatestCommitSubject();
 */
export async function getLatestCommitSubject() {
    return await execWithOutput('git', ['log', '-1', '--pretty=format:%s']);
}
export async function getLatestCommitMessage() {
    return await execWithOutput('git', ['log', '-1', '--pretty=%B']);
}
/**
 * Extracts version from commit message in format "bump version to x.x.x.x".
 *
 * @example
 * const version = extractVersionFromCommit("bump version to 1.2.3.4");
 */
export function extractVersionFromCommit(commitMessage) {
    const match = commitMessage.match(/bump version to (\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
}
export async function updateGit(newVersion, csprojPath, commitUser, commitEmail, commitMessagePrefix) {
    await execWithOutput('git', ['config', 'user.name', commitUser]);
    await execWithOutput('git', ['config', 'user.email', commitEmail]);
    await execWithOutput('git', ['add', csprojPath]);
    const commitMessageFinal = `${commitMessagePrefix}${newVersion}`;
    await execWithOutput('git', ['commit', '-m', commitMessageFinal]);
    await execWithOutput('git', ['push']);
    core.info(`Committed and pushed version update: "${commitMessageFinal}"`);
}
