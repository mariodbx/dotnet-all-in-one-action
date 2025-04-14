import * as core from '@actions/core';
import { getInputOrDefault } from './utils/input-utils.js';
import { getLatestCommitMessage, updateGit } from './utils/git.js';
import { findCsprojFile, readCsprojFile, updateCsprojFile, extractVersion, updateVersionContent } from './utils/csproj.js';
import { parseVersion, bumpVersion } from './utils/versioning.js';
export async function run() {
    try {
        // Retrieve configurable inputs.
        const csprojDepthInput = getInputOrDefault('csproj_depth', '1');
        const csprojName = getInputOrDefault('csproj_name', '*.csproj');
        const commitUser = getInputOrDefault('commit_user', 'github-actions');
        const commitEmail = getInputOrDefault('commit_email', 'github-actions@users.noreply.github.com');
        const commitMessagePrefix = getInputOrDefault('commit_message_prefix', 'chore: bump version to ');
        core.info(`Configuration: csproj_depth=${csprojDepthInput}, csproj_name=${csprojName}, commit_user=${commitUser}, commit_email=${commitEmail}`);
        // Get the latest commit message.
        const commitMessage = await getLatestCommitMessage();
        core.info(`Latest commit message: "${commitMessage}"`);
        // Determine bump type by taking the first 5 alphanumeric characters in lowercase.
        const bumpType = commitMessage
            .substring(0, 5)
            .replace(/[^A-Za-z]/g, '')
            .toLowerCase();
        core.info(`Extracted bump type: "${bumpType}"`);
        if (!['patch', 'minor', 'major'].includes(bumpType)) {
            core.info('Commit message does not indicate a version bump. Skipping release.');
            core.setOutput('skip_release', 'true');
            return;
        }
        core.setOutput('skip_release', 'false');
        core.setOutput('bump_type', bumpType);
        // Validate csproj depth.
        const csprojDepth = parseInt(csprojDepthInput, 10);
        if (isNaN(csprojDepth) || csprojDepth < 1) {
            throw new Error('csproj_depth must be a positive integer');
        }
        // Locate the csproj file.
        const csprojPath = await findCsprojFile(csprojDepth, csprojName);
        if (!csprojPath) {
            throw new Error(`No csproj file found with name "${csprojName}"`);
        }
        core.info(`Found csproj file: ${csprojPath}`);
        // Read and parse the csproj file.
        const csprojContent = await readCsprojFile(csprojPath);
        const currentVersion = extractVersion(csprojContent);
        core.info(`Current version: ${currentVersion}`);
        core.setOutput('current_version', currentVersion);
        const versionData = parseVersion(currentVersion);
        const newVersion = bumpVersion(versionData, bumpType);
        core.info(`New version: ${newVersion}`);
        core.setOutput('new_version', newVersion);
        // Update the csproj file with the new version.
        const newCsprojContent = updateVersionContent(csprojContent, newVersion);
        await updateCsprojFile(csprojPath, newCsprojContent);
        core.info(`csproj file updated with new version.`);
        // Update Git with the version bump.
        await updateGit(newVersion, csprojPath, commitUser, commitEmail, commitMessagePrefix);
        core.info(`Version bump process completed successfully.`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed(String(error));
        }
        throw error;
    }
}
