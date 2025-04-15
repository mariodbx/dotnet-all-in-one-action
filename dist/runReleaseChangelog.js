import * as core from '@actions/core';
import { getLatestCommitSubject, extractVersionFromCommit } from './utils/git.js';
import { findCsprojFile, extractVersionFromCsproj } from './utils/csproj.js';
import { generateChangelog } from './utils/changelog.js';
import { releaseExists, createRelease } from './utils/release.js';
import { getInputs } from './utils/inputs.js';
import * as fs from 'fs/promises';
export async function runReleaseChangelog() {
    try {
        const inputs = getInputs(); // Use getInputs to retrieve all inputs.
        if (!inputs.runReleaseAndChangelog) {
            core.info('Skipping release and changelog as per input.');
            return;
        }
        const token = process.env.GHCR_TOKEN || '';
        const repo = process.env.GITHUB_REPOSITORY || '';
        if (!repo)
            throw new Error('GITHUB_REPOSITORY is not defined.');
        let version = null;
        if (inputs.useCommitMessage) {
            const commitSubject = await getLatestCommitSubject(inputs.showFullOutput);
            core.info(`Latest commit subject: "${commitSubject}"`);
            version = extractVersionFromCommit(commitSubject);
            if (!version) {
                core.info('No version bump detected in commit message. Skipping release.');
                core.setOutput('skip', 'true');
                return;
            }
        }
        else {
            core.info(`Searching for csproj file with pattern "${inputs.csprojName}" at max depth ${inputs.csprojDepth}`);
            const csprojPath = await findCsprojFile(inputs.csprojDepth, inputs.csprojName, inputs.showFullOutput);
            core.info(`Found csproj file at: ${csprojPath}`);
            const csprojContent = await fs.readFile(csprojPath, 'utf8');
            version = extractVersionFromCsproj(csprojContent);
            if (!version) {
                core.info('No version found in the .csproj file. Skipping release.');
                core.setOutput('skip', 'true');
                return;
            }
        }
        core.info(`Extracted version: ${version}`);
        core.setOutput('version', version);
        core.setOutput('skip', 'false');
        const changelog = await generateChangelog();
        core.setOutput('changelog', changelog);
        const exists = await releaseExists(repo, version, token);
        if (exists) {
            core.info(`Release v${version} already exists. Skipping creation.`);
            return;
        }
        await createRelease(repo, version, changelog, token);
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
        throw error;
    }
}
