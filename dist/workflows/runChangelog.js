// runChangelog.ts
import * as core from '@actions/core';
import { generateChangelog, createRelease } from '../utils/release.js';
import { runDockerPush, checkGhcrImageExists } from './runDockerPush.js';
import { getInputs } from '../utils/inputs.js';
import { findCsprojFile, readCsprojFile, extractVersion } from '../utils/csproj.js';
import { zipDirectory, uploadReleaseAssets } from '../utils/uploadAssets.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export async function runChangelog() {
    try {
        const inputs = getInputs();
        if (!inputs.runChangelog && !inputs.includeGhcrPackage) {
            core.info('Changelog generation and GHCR package inclusion are disabled. Skipping...');
            return;
        }
        let changelog = '';
        let version = '';
        // Retrieve version from .csproj if not provided
        if (!version) {
            core.info('Version not provided in inputs. Attempting to read from .csproj...');
            try {
                const csprojPath = await findCsprojFile(inputs.csprojDepth, inputs.csprojName);
                const csprojContent = await readCsprojFile(csprojPath);
                version = extractVersion(csprojContent);
                core.info(`Version extracted from .csproj: ${version}`);
            }
            catch (error) {
                throw new Error(`Failed to retrieve version from .csproj: ${error}`);
            }
        }
        let imageName = '';
        if (inputs.includeGhcrPackage) {
            core.info('Including GHCR package...');
            const repo = process.env.GITHUB_REPOSITORY || '';
            if (!repo) {
                throw new Error('GITHUB_REPOSITORY is not defined.');
            }
            imageName = `${repo}/${inputs.dockerfileImages}:${version}`;
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
            // Append GHCR package details as text in the changelog (for reference).
            changelog += `\n\n### GHCR Package\n- Image: \`${imageName}\``;
            core.info('GHCR package details added to changelog.');
        }
        else if (inputs.runChangelog) {
            core.info('Generating changelog...');
            changelog = await generateChangelog();
        }
        // If requested, include .NET binaries details in the changelog text.
        if (inputs.includeDotnetBinaries) {
            core.info('Including .NET binaries in the changelog...');
            const binaryPaths = [
                './publish/linux',
                './publish/windows',
                './publish/macos'
            ];
            const binaryDetails = binaryPaths
                .map((binPath) => `- Published binaries available at: ${binPath}`)
                .join('\n');
            changelog += `\n\n### .NET Binaries\n${binaryDetails}`;
            core.info('Binary paths added to changelog.');
        }
        // Create the GitHub release and retrieve its data.
        if (!inputs.runRelease) {
            core.info('Release creation not enabled; skipping release upload.');
            return;
        }
        core.info('Creating release...');
        const token = process.env.GITHUB_TOKEN || '';
        const repoFull = process.env.GITHUB_REPOSITORY || '';
        if (!repoFull || !version) {
            throw new Error('GITHUB_REPOSITORY or version is not defined.');
        }
        const releaseResponse = await createRelease(repoFull, version, changelog, token);
        // Prepare assets for upload.
        const assets = [];
        // Zip binaries for each supported platform.
        if (inputs.includeDotnetBinaries) {
            core.info('Zipping binary assets...');
            const platforms = [
                { name: 'linux', dir: './publish/linux' },
                { name: 'windows', dir: './publish/windows' },
                { name: 'macos', dir: './publish/macos' }
            ];
            for (const platform of platforms) {
                // Define the zip output path (e.g. ./publish/linux.zip).
                const zipPath = path.join('./publish', `${platform.name}.zip`);
                await zipDirectory(platform.dir, zipPath);
                assets.push({ name: `${platform.name}.zip`, path: zipPath });
            }
        }
        // Create a text asset for GHCR details if requested.
        if (inputs.includeGhcrPackage) {
            core.info('Creating GHCR details asset...');
            const ghcrDetailsPath = './ghcr-details.txt';
            const content = `GHCR Image: ${imageName}\nYou can pull the image using:\ndocker pull ${imageName}\n`;
            await fs.writeFile(ghcrDetailsPath, content, 'utf8');
            assets.push({ name: 'ghcr-details.txt', path: ghcrDetailsPath });
        }
        // Upload the assets to the GitHub release.
        if (assets.length > 0) {
            const [owner, repoName] = repoFull.split('/');
            core.info(`Uploading ${assets.length} assets to release ID ${releaseResponse.data.id}...`);
            await uploadReleaseAssets(token, owner, repoName, releaseResponse.data.id, assets);
            core.info('All assets have been successfully uploaded.');
        }
        else {
            core.info('No assets to upload.');
        }
        core.info('Changelog and release process completed successfully.');
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
        throw error;
    }
}
