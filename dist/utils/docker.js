import * as core from '@actions/core';
import * as exec from '@actions/exec';
/**
 * Returns a fully qualified image name based on the registry type.
 *
 * @param image - The base image name (e.g., "sample-project.mvc").
 * @param registryType - The container registry type (e.g., "ghcr", "acr", "dockerhub").
 * @returns The fully qualified image name.
 */
export function qualifyImageName(image, registryType) {
    switch (registryType.toLowerCase()) {
        case 'ghcr': {
            // Use the repository owner from GITHUB_REPOSITORY, or fall back to a default.
            const owner = process.env.GITHUB_REPOSITORY?.toLowerCase().split('/')[0] ||
                'default-owner';
            // If the image is already qualified, return as is.
            if (image.startsWith('ghcr.io/')) {
                return image;
            }
            return `ghcr.io/${owner}/${image}`;
        }
        case 'acr': {
            // Expect the ACR server to be provided as an env var.
            if (!process.env.ACR_SERVER) {
                throw new Error('ACR_SERVER environment variable is not set.');
            }
            // If the image is already fully qualified, return it.
            if (image.startsWith(process.env.ACR_SERVER)) {
                return image;
            }
            return `${process.env.ACR_SERVER}/${image}`;
        }
        case 'dockerhub': {
            // For Docker Hub, if the image doesn’t include a slash, prepend the username.
            const username = process.env.DOCKERHUB_USERNAME || '';
            if (image.includes('/') || !username) {
                return image;
            }
            return `${username}/${image}`;
        }
        default:
            throw new Error(`Unsupported registry type: ${registryType}`);
    }
}
/**
 * Performs a Docker login based on the registry type.
 *
 * @param registryType - The container registry type (e.g., ghcr, acr, dockerhub).
 */
export async function dockerLogin(registryType) {
    const credentials = {
        ghcr: {
            username: (process.env.GHCR_USERNAME || '').trim(),
            token: (process.env.GHCR_TOKEN || '').trim(),
            server: 'ghcr.io'
        },
        acr: {
            username: (process.env.ACR_USERNAME || '').trim(),
            token: (process.env.ACR_PASSWORD || '').trim(),
            server: process.env.ACR_SERVER
        },
        dockerhub: {
            username: (process.env.DOCKERHUB_USERNAME || '').trim(),
            token: (process.env.DOCKERHUB_TOKEN || '').trim(),
            server: 'docker.io'
        }
    };
    const registry = credentials[registryType.toLowerCase()];
    if (!registry)
        throw new Error(`Unsupported registry type: ${registryType}`);
    if (!registry.username || !registry.token) {
        throw new Error(`${registryType.toUpperCase()} credentials are missing.`);
    }
    // Log into the docker registry.
    const server = registry.server;
    core.info(`Logging into ${server}...`);
    await exec.exec('docker', ['login', server || '', '-u', registry.username, '--password-stdin'], {
        input: Buffer.from(registry.token)
    });
    core.info(`Logged into ${server} as ${registry.username}`);
}
/**
 * Builds and pushes images using Docker Compose.
 *
 * @param dockerComposeFile - The docker-compose file to use.
 * @param version - The version to use for tagging.
 * @param images - An array of image names as declared in docker-compose.
 * @param pushWithVersion - Whether to push images tagged with the version.
 * @param pushWithLatest - Whether to push images tagged as latest.
 * @param registryType - The container registry type.
 */
export async function buildAndPushCompose(dockerComposeFile, version, images, pushWithVersion, pushWithLatest, registryType) {
    core.info(`Building using Docker Compose file: ${dockerComposeFile}`);
    await exec.exec('docker-compose', ['-f', dockerComposeFile, 'build']);
    // Push with version tag if enabled.
    if (pushWithVersion) {
        core.info(`Pushing images (version tag "${version}")...`);
        for (const image of images) {
            const qualifiedImage = qualifyImageName(image, registryType);
            const imageWithVersion = `${qualifiedImage}:${version}`;
            await exec.exec('docker', ['push', imageWithVersion]);
        }
    }
    // If latest is enabled, tag and push.
    if (pushWithLatest) {
        for (const image of images) {
            const qualifiedImage = qualifyImageName(image, registryType);
            const imageWithVersion = `${qualifiedImage}:${version}`;
            const imageLatest = `${qualifiedImage}:latest`;
            core.info(`Tagging ${imageWithVersion} as ${imageLatest}`);
            await exec.exec('docker', ['tag', imageWithVersion, imageLatest]);
            core.info(`Pushing ${imageLatest}...`);
            await exec.exec('docker', ['push', imageLatest]);
        }
    }
}
/**
 * Builds and pushes an image using a Dockerfile.
 *
 * @param dockerfile - The path to the Dockerfile.
 * @param buildContext - The build context for the Docker build.
 * @param version - The version tag.
 * @param image - The image name (repository) to use.
 * @param registryType - The container registry type.
 * @param pushWithVersion - Whether to push images tagged with the version.
 * @param pushWithLatest - Whether to push images tagged as latest.
 */
export async function buildAndPushDockerfile(dockerfile, buildContext, version, image, registryType, pushWithVersion, pushWithLatest) {
    // Qualify the image name for the registry.
    const qualifiedImage = qualifyImageName(image, registryType);
    // If pushWithVersion is set, build with version tag.
    if (pushWithVersion) {
        const imageWithVersion = `${qualifiedImage}:${version}`;
        core.info(`Building image ${imageWithVersion} from Dockerfile: ${dockerfile}`);
        await exec.exec('docker', [
            'build',
            '-f',
            dockerfile,
            '-t',
            imageWithVersion,
            buildContext
        ]);
        core.info(`Pushing ${imageWithVersion}...`);
        await exec.exec('docker', ['push', imageWithVersion]);
    }
    // If pushWithLatest is set, tag the built image as latest and push.
    if (pushWithLatest) {
        const imageWithVersion = `${qualifiedImage}:${version}`;
        const imageLatest = `${qualifiedImage}:latest`;
        core.info(`Tagging ${imageWithVersion} as ${imageLatest}`);
        await exec.exec('docker', ['tag', imageWithVersion, imageLatest]);
        core.info(`Pushing ${imageLatest}...`);
        await exec.exec('docker', ['push', imageLatest]);
    }
}
