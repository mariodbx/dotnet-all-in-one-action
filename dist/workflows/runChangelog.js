import * as core from '@actions/core';
import { generateChangelog, createRelease } from '../utils/release.js';
import { runDockerPush, checkGhcrImageExists } from './runDockerPush.js';
import { getInputs } from '../utils/inputs.js';
export async function runChangelog() {
    try {
        const inputs = getInputs();
        if (!inputs.runChangelog && !inputs.includeGhcrPackage) {
            core.info('Changelog generation and GHCR package inclusion are disabled. Skipping...');
            return;
        }
        let changelog = '';
        if (inputs.includeGhcrPackage) {
            core.info('Including GHCR package...');
            const version = inputs.version || '';
            if (!version) {
                throw new Error('Version is not defined.');
            }
            const repo = process.env.GITHUB_REPOSITORY || '';
            if (!repo) {
                throw new Error('GITHUB_REPOSITORY is not defined.');
            }
            const imageName = `${repo}/${inputs.dockerfileImages}:${version}`;
            const imageExists = await checkGhcrImageExists(imageName);
            if (imageExists) {
                core.info(`GHCR package image ${imageName} already exists.`);
            }
            else {
                core.info(`GHCR package image ${imageName} does not exist. Pushing...`);
                await runDockerPush();
            }
            core.info('Generating changelog with GHCR package details...');
            changelog = await generateChangelog();
            // Add GHCR package image details to the changelog
            changelog += `\n\n### GHCR Package\n- Image: \`${imageName}\``;
            core.info('GHCR package image details added to the changelog.');
        }
        else if (inputs.runChangelog) {
            core.info('Generating changelog...');
            changelog = await generateChangelog();
        }
        if (inputs.includeDotnetBinaries) {
            core.info('Including .NET binaries in the changelog...');
            const binaryPaths = [
                './publish/linux',
                './publish/windows',
                './publish/macos'
            ];
            const binaryDetails = binaryPaths
                .map((path) => `- Published binaries available at: ${path}`)
                .join('\n');
            changelog += `\n\n### .NET Binaries\n${binaryDetails}`;
            core.info('.NET binaries paths added to the changelog.');
        }
        if (inputs.runRelease) {
            core.info('Creating release...');
            const token = process.env.GITHUB_TOKEN || '';
            const repo = process.env.GITHUB_REPOSITORY || '';
            const version = inputs.version || '';
            if (!repo || !version) {
                throw new Error('GITHUB_REPOSITORY or version is not defined.');
            }
            await createRelease(repo, version, changelog, token);
        }
        core.info('Changelog and release process completed successfully.');
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
        throw error;
    }
}
