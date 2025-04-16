// runRelease.ts
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getLatestCommitSubject, extractVersionFromCommit } from '../utils/git.js';
import { findCsprojFile, extractVersionFromCsproj } from '../utils/csproj.js';
import { releaseExists, createRelease } from '../utils/release.js';
import { getInputs } from '../utils/inputs.js';
import { wait } from '../utils/wait.js';
import * as fs from 'fs/promises';
export async function runRelease() {
    try {
        const inputs = getInputs();
        const token = process.env.GITHUB_TOKEN || '';
        const repo = process.env.GITHUB_REPOSITORY || '';
        if (!repo)
            throw new Error('GITHUB_REPOSITORY is not defined.');
        let version = null;
        core.info('Waiting for 5 seconds before ensuring the latest version...');
        await wait(5000);
        core.info('Running git pull to fetch the latest version...');
        await exec.exec('git', ['pull']);
        // Determine version based on configuration.
        if (inputs.useCommitMessage) {
            const commitSubject = await getLatestCommitSubject();
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
            const csprojPath = await findCsprojFile(inputs.csprojDepth, inputs.csprojName);
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
        // Set outputs for downstream jobs.
        core.setOutput('version', version);
        core.setOutput('skip', 'false');
        // Check if a release for this version already exists.
        const exists = await releaseExists(repo, version, token);
        if (exists) {
            core.info(`Release v${version} already exists. Skipping creation.`);
            return;
        }
        // Create a new release (changelog is left empty; it will be added later by runChangelog).
        await createRelease(repo, version, '', token);
        core.info(`Release v${version} created successfully.`);
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
        throw error;
    }
}
