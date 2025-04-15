import * as core from '@actions/core';
import * as fs from 'fs/promises';
import { findCsprojFile, extractVersionFromCsproj } from './utils/csproj.js';
import { getLatestCommitSubject, extractVersionFromCommit } from './utils/git.js';
import { generateChangelog } from './utils/changelog.js';
import { releaseExists, createRelease } from './utils/release.js';
import { dockerLogin, buildAndPushCompose, buildAndPushDockerfile } from './utils/docker.js';
import { getInputs } from './utils/inputs.js';
export async function runDocker() {
    try {
        // Retrieve and parse common inputs.
        const inputs = getInputs();
        if (!inputs.runPushToRegistry) {
            core.info('Skipping push to registry as requested.');
            return;
        }
        const changelogToken = process.env.GH_TOKEN || '';
        const repo = process.env.GITHUB_REPOSITORY || '';
        if (!repo)
            throw new Error('GITHUB_REPOSITORY is not defined.');
        // Validate that at least one push flag is set if pushToRegistry is true.
        if (!inputs.runPushToRegistry &&
            !inputs.pushWithVersion &&
            !inputs.pushWithLatest) {
            throw new Error('At least one push flag ("push_with_version" or "push_with_latest") must be true when "push_to_registry" is enabled.');
        }
        let version = null;
        // Determine version based on commit message or .csproj file.
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
            const csprojPath = await findCsprojFile(inputs.csprojDepth, inputs.csprojName, inputs.showFullOutput);
            if (!csprojPath) {
                throw new Error(`No .csproj file found with name "${inputs.csprojName}".`);
            }
            core.info(`Found .csproj file: ${csprojPath}`);
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
        // Generate changelog.
        const changelog = await generateChangelog();
        core.setOutput('changelog', changelog);
        // Check if release already exists.
        const exists = await releaseExists(repo, version, changelogToken);
        if (exists) {
            core.info(`Release v${version} already exists. Skipping creation.`);
            return;
        }
        // Create release.
        await createRelease(repo, version, changelog, changelogToken);
        // Log into Docker registry if pushToRegistry is true.
        if (inputs.runPushToRegistry) {
            await dockerLogin(inputs.registryType, inputs.showFullOutput);
            // Process Docker Compose builds if provided.
            const dockerComposeFilesInput = core.getInput('docker_compose_files');
            const imagesInput = core.getInput('images'); // For docker-compose builds.
            if (dockerComposeFilesInput) {
                if (!imagesInput) {
                    throw new Error('Input "images" is required when using Docker Compose files.');
                }
                const dcFiles = dockerComposeFilesInput
                    .split(',')
                    .map((file) => file.trim())
                    .filter((file) => file);
                const composeImages = imagesInput
                    .split(',')
                    .map((img) => img.trim())
                    .filter((img) => img);
                for (const file of dcFiles) {
                    core.info(`Processing Docker Compose file: ${file}`);
                    await buildAndPushCompose(file, version, composeImages, inputs.pushWithVersion, inputs.pushWithLatest, inputs.registryType, inputs.showFullOutput);
                }
            }
            // Process Dockerfile builds if provided.
            const dockerfilesInput = core.getInput('dockerfiles');
            if (dockerfilesInput) {
                const dockerfileImagesInput = core.getInput('dockerfile_images');
                if (!dockerfileImagesInput) {
                    throw new Error('Input "dockerfile_images" is required when using Dockerfiles.');
                }
                const dockerfiles = dockerfilesInput
                    .split(',')
                    .map((f) => f.trim())
                    .filter((f) => f);
                const dockerfileImages = dockerfileImagesInput
                    .split(',')
                    .map((img) => img.trim())
                    .filter((img) => img);
                const dockerfileContextsInput = core.getInput('dockerfile_contexts');
                let contexts;
                if (dockerfileContextsInput) {
                    contexts = dockerfileContextsInput
                        .split(',')
                        .map((c) => c.trim())
                        .filter((c) => c);
                }
                else {
                    contexts = dockerfiles.map(() => '.');
                }
                if (dockerfiles.length !== dockerfileImages.length ||
                    dockerfiles.length !== contexts.length) {
                    throw new Error('The number of Dockerfiles, dockerfile_images, and dockerfile_contexts must be the same.');
                }
                for (let i = 0; i < dockerfiles.length; i++) {
                    core.info(`Processing Dockerfile: ${dockerfiles[i]} with context: ${contexts[i]} and image: ${dockerfileImages[i]}`);
                    await buildAndPushDockerfile(dockerfiles[i], contexts[i], version, dockerfileImages[i], inputs.registryType, inputs.pushWithVersion, inputs.pushWithLatest);
                }
            }
        }
        core.info('Docker build and push steps completed successfully.');
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
        throw error;
    }
}
