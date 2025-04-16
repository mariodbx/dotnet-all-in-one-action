import * as core from '@actions/core';
import * as exec from '@actions/exec';
/**
 * Returns a fully qualified image name based on the registry type.
 *
 * @param {string} image - The base image name (e.g., "sample-project.mvc").
 * @param {string} registryType - The container registry type (e.g., "ghcr", "acr", "dockerhub").
 * @returns {string} The fully qualified image name.
 * @throws {Error} Throws an error if the registry type is unsupported.
 * @example
 * const imageName: string = qualifyImageName('my-app', 'ghcr');
 * console.log(imageName); // "ghcr.io/<owner>/my-app"
 * @remarks
 * - For `ghcr`, the repository owner is derived from the `GITHUB_REPOSITORY` environment variable.
 * - For `acr`, the `ACR_SERVER` environment variable must be set.
 * - For `dockerhub`, the username is prepended if the image name does not include a slash.
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
 * @param {string} registryType - The container registry type (e.g., "ghcr", "acr", "dockerhub").
 * @param {boolean} showFullOutput - Whether to return the full output of the command.
 * @returns {Promise<string>} The full output of the command if `showFullOutput` is true, otherwise undefined.
 * @throws {Error} Throws an error if the registry type is unsupported or credentials are missing.
 * @example
 * const output: string = await dockerLogin('ghcr', true);
 * console.log(output);
 * @remarks
 * - Ensure the appropriate environment variables for credentials are set before calling this function.
 * - The `docker login` command is executed with the provided credentials.
 */
export async function dockerLogin(registryType, showFullOutput) {
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
    const server = registry.server;
    core.info(`Logging into ${server}...`);
    const options = {
        input: Buffer.from(registry.token),
        silent: !showFullOutput
    };
    await exec.exec('docker', ['login', server || '', '-u', registry.username, '--password-stdin'], options);
    return showFullOutput ? `Logged into ${server}` : '';
}
/**
 * Builds and pushes images using Docker Compose.
 *
 * @param {string} dockerComposeFile - The docker-compose file to use.
 * @param {string} version - The version to use for tagging.
 * @param {string[]} images - An array of image names as declared in docker-compose.
 * @param {boolean} pushWithVersion - Whether to push images tagged with the version.
 * @param {boolean} pushWithLatest - Whether to push images tagged as latest.
 * @param {string} registryType - The container registry type.
 * @param {boolean} showFullOutput - Whether to return the full output of the command.
 * @returns {Promise<string | void>} The full output of the command if `showFullOutput` is true, otherwise undefined.
 * @throws {Error} Throws an error if the build or push commands fail.
 * @example
 * const output: string | void = await buildAndPushCompose(
 *   'docker-compose.yml',
 *   '1.0.0',
 *   ['app'],
 *   true,
 *   true,
 *   'ghcr',
 *   true
 * );
 * @remarks
 * - This function builds and optionally pushes images using Docker Compose.
 * - Ensure the `docker-compose` CLI is installed and available in the PATH.
 */
export async function buildAndPushCompose(dockerComposeFile, version, images, pushWithVersion, pushWithLatest, registryType) {
    core.info(`Building using Docker Compose file: ${dockerComposeFile}`);
    await exec.exec('docker-compose', ['-f', dockerComposeFile, 'build'], {});
    if (pushWithVersion) {
        core.info(`Pushing images (version tag "${version}")...`);
        for (const image of images) {
            const qualifiedImage = qualifyImageName(image, registryType);
            const imageWithVersion = `${qualifiedImage}:${version}`;
            await exec.exec('docker', ['push', imageWithVersion], {});
        }
    }
    if (pushWithLatest) {
        for (const image of images) {
            const qualifiedImage = qualifyImageName(image, registryType);
            const imageWithVersion = `${qualifiedImage}:${version}`;
            const imageLatest = `${qualifiedImage}:latest`;
            core.info(`Tagging ${imageWithVersion} as ${imageLatest}`);
            await exec.exec('docker', ['tag', imageWithVersion, imageLatest], {});
            await exec.exec('docker', ['push', imageLatest], {});
        }
    }
}
/**
 * Builds and pushes an image using a Dockerfile.
 *
 * @param {string} dockerfile - The path to the Dockerfile.
 * @param {string} buildContext - The build context for the Docker build.
 * @param {string} version - The version tag.
 * @param {string} image - The image name (repository) to use.
 * @param {string} registryType - The container registry type.
 * @param {boolean} pushWithVersion - Whether to push images tagged with the version.
 * @param {boolean} pushWithLatest - Whether to push images tagged as latest.
 * @returns {Promise<void>} Resolves when the build and push operations are complete.
 * @throws {Error} Throws an error if the build or push commands fail.
 * @example
 * await buildAndPushDockerfile(
 *   'Dockerfile',
 *   '.',
 *   '1.0.0',
 *   'my-app',
 *   'ghcr',
 *   true,
 *   true
 * );
 * @remarks
 * - This function builds and optionally pushes a Docker image using a Dockerfile.
 * - Ensure the `docker` CLI is installed and available in the PATH.
 */
export async function buildAndPushDockerfile(dockerfile, buildContext, version, image, registryType, pushWithVersion, pushWithLatest) {
    const qualifiedImage = qualifyImageName(image, registryType);
    if (pushWithVersion) {
        const imageWithVersion = `${qualifiedImage}:${version}`;
        core.info(`Building image ${imageWithVersion} from Dockerfile: ${dockerfile}`);
        await exec.exec('docker', ['build', '-f', dockerfile, '-t', imageWithVersion, buildContext], { silent: false });
        core.info(`Pushing ${imageWithVersion}...`);
        await exec.exec('docker', ['push', imageWithVersion], { silent: false });
    }
    if (pushWithLatest) {
        const imageLatest = `${qualifiedImage}:latest`;
        core.info(`Tagging ${qualifiedImage}:${version} as ${imageLatest}`);
        await exec.exec('docker', ['tag', `${qualifiedImage}:${version}`, imageLatest], {});
        core.info(`Pushing ${imageLatest}...`);
        await exec.exec('docker', ['push', imageLatest], { silent: false });
    }
}
