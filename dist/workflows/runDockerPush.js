import * as core from '@actions/core';
import { dockerLogin, qualifyImageName, buildAndPushCompose, buildAndPushDockerfile } from '../utils/docker.js';
import { getInputs } from '../utils/inputs.js';
export async function runDockerPush() {
    try {
        const inputs = getInputs();
        // Log into Docker registry using dockerLogin.
        await dockerLogin(inputs.registryType, false);
        // Extract version from inputs or set a default.
        const currentVersion = core.getInput('current_version');
        const newVersion = core.getInput('new_version');
        core.info(`Current version: ${currentVersion}, New version: ${newVersion}`);
        if (!newVersion) {
            core.error('New version is required.');
            core.setFailed('New version is required.');
            return;
        }
        // Process Docker Compose builds if provided.
        if (inputs.dockerComposeFiles) {
            if (!inputs.images) {
                throw new Error('Input "images" is required when using Docker Compose files.');
            }
            const dcFiles = inputs.dockerComposeFiles
                .split(',')
                .map((file) => file.trim())
                .filter((file) => file);
            const composeImages = inputs.images
                .split(',')
                .map((img) => qualifyImageName(img.trim(), inputs.registryType))
                .filter((img) => img);
            for (const file of dcFiles) {
                core.info(`Processing Docker Compose file: ${file}`);
                await buildAndPushCompose(file, newVersion, composeImages, inputs.pushWithVersion, inputs.pushWithLatest, inputs.registryType);
            }
        }
        // Process Dockerfile builds if provided.
        if (inputs.dockerfiles) {
            if (!inputs.dockerfileImages) {
                throw new Error('Input "dockerfile_images" is required when using Dockerfiles.');
            }
            const dockerfiles = inputs.dockerfiles
                .split(',')
                .map((f) => f.trim())
                .filter((f) => f);
            const dockerfileImages = inputs.dockerfileImages
                .split(',')
                .map((img) => qualifyImageName(img.trim(), inputs.registryType))
                .filter((img) => img);
            const contexts = inputs.dockerfileContexts
                ? inputs.dockerfileContexts
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c)
                : dockerfiles.map(() => '.');
            if (dockerfiles.length !== dockerfileImages.length ||
                dockerfiles.length !== contexts.length) {
                throw new Error('The number of Dockerfiles, dockerfile_images, and dockerfile_contexts must be the same.');
            }
            for (let i = 0; i < dockerfiles.length; i++) {
                core.info(`Processing Dockerfile: ${dockerfiles[i]} with context: ${contexts[i]} and image: ${dockerfileImages[i]}`);
                await buildAndPushDockerfile(dockerfiles[i], contexts[i], newVersion, dockerfileImages[i], inputs.registryType, inputs.pushWithVersion, inputs.pushWithLatest);
            }
        }
        core.info('Docker push steps completed successfully.');
    }
    catch (error) {
        core.error('An error occurred during Docker push.');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
    }
}
