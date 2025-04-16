import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Interface for container registry operations.
 */
interface IRegistry {
  qualifyImageName(image: string): string
  login(showFullOutput: boolean): Promise<string>
}

/**
 * GHCR registry implementation.
 */
class GHCRRegistry implements IRegistry {
  qualifyImageName(image: string): string {
    const owner =
      process.env.GITHUB_REPOSITORY?.toLowerCase().split('/')[0] ||
      'default-owner'
    if (image.startsWith('ghcr.io/')) {
      return image
    }
    return `ghcr.io/${owner}/${image}`
  }

  async login(showFullOutput: boolean): Promise<string> {
    const username = (process.env.GHCR_USERNAME || '').trim()
    const token = (process.env.GHCR_TOKEN || '').trim()
    const server = 'ghcr.io'

    if (!username || !token) {
      throw new Error('GHCR credentials are missing.')
    }

    core.info(`Logging into ${server}...`)
    const options = {
      input: Buffer.from(token),
      silent: !showFullOutput
    }

    await exec.exec(
      'docker',
      ['login', server, '-u', username, '--password-stdin'],
      options
    )
    return showFullOutput ? `Logged into ${server}` : ''
  }
}

/**
 * ACR registry implementation.
 */
class ACRRegistry implements IRegistry {
  qualifyImageName(image: string): string {
    const server = process.env.ACR_SERVER
    if (!server) {
      throw new Error('ACR_SERVER environment variable is not set.')
    }
    if (image.startsWith(server)) {
      return image
    }
    return `${server}/${image}`
  }

  async login(showFullOutput: boolean): Promise<string> {
    const username = (process.env.ACR_USERNAME || '').trim()
    const token = (process.env.ACR_PASSWORD || '').trim()
    const server = process.env.ACR_SERVER

    if (!username || !token || !server) {
      throw new Error('ACR credentials are missing.')
    }

    core.info(`Logging into ${server}...`)
    const options = {
      input: Buffer.from(token),
      silent: !showFullOutput
    }

    await exec.exec(
      'docker',
      ['login', server, '-u', username, '--password-stdin'],
      options
    )
    return showFullOutput ? `Logged into ${server}` : ''
  }
}

/**
 * DockerHub registry implementation.
 */
class DockerHubRegistry implements IRegistry {
  qualifyImageName(image: string): string {
    const username = process.env.DOCKERHUB_USERNAME || ''
    if (image.includes('/') || !username) {
      return image
    }
    return `${username}/${image}`
  }

  async login(showFullOutput: boolean): Promise<string> {
    const username = (process.env.DOCKERHUB_USERNAME || '').trim()
    const token = (process.env.DOCKERHUB_TOKEN || '').trim()
    const server = 'docker.io'

    if (!username || !token) {
      throw new Error('DockerHub credentials are missing.')
    }

    core.info(`Logging into ${server}...`)
    const options = {
      input: Buffer.from(token),
      silent: !showFullOutput
    }

    await exec.exec(
      'docker',
      ['login', server, '-u', username, '--password-stdin'],
      options
    )
    return showFullOutput ? `Logged into ${server}` : ''
  }
}

/**
 * Factory to create registry instances.
 */
class RegistryFactory {
  static createRegistry(registryType: string): IRegistry {
    switch (registryType.toLowerCase()) {
      case 'ghcr':
        return new GHCRRegistry()
      case 'acr':
        return new ACRRegistry()
      case 'dockerhub':
        return new DockerHubRegistry()
      default:
        throw new Error(`Unsupported registry type: ${registryType}`)
    }
  }
}

/**
 * Builds and pushes images using Docker Compose.
 */
export async function buildAndPushCompose(
  dockerComposeFile: string,
  version: string,
  images: string[],
  pushWithVersion: boolean,
  pushWithLatest: boolean,
  registryType: string
): Promise<string | void> {
  const registry = RegistryFactory.createRegistry(registryType)

  core.info(`Building using Docker Compose file: ${dockerComposeFile}`)
  await exec.exec('docker-compose', ['-f', dockerComposeFile, 'build'], {})

  if (pushWithVersion) {
    core.info(`Pushing images (version tag "${version}")...`)
    for (const image of images) {
      const qualifiedImage = registry.qualifyImageName(image)
      const imageWithVersion = `${qualifiedImage}:${version}`
      await exec.exec('docker', ['push', imageWithVersion], {})
    }
  }

  if (pushWithLatest) {
    for (const image of images) {
      const qualifiedImage = registry.qualifyImageName(image)
      const imageWithVersion = `${qualifiedImage}:${version}`
      const imageLatest = `${qualifiedImage}:latest`
      core.info(`Tagging ${imageWithVersion} as ${imageLatest}`)
      await exec.exec('docker', ['tag', imageWithVersion, imageLatest], {})
      await exec.exec('docker', ['push', imageLatest], {})
    }
  }
}

/**
 * Builds and pushes an image using a Dockerfile.
 */
export async function buildAndPushDockerfile(
  dockerfile: string,
  buildContext: string,
  version: string,
  image: string,
  registryType: string,
  pushWithVersion: boolean,
  pushWithLatest: boolean
): Promise<void> {
  const registry = RegistryFactory.createRegistry(registryType)
  const qualifiedImage = registry.qualifyImageName(image)

  if (pushWithVersion) {
    const imageWithVersion = `${qualifiedImage}:${version}`
    core.info(
      `Building image ${imageWithVersion} from Dockerfile: ${dockerfile}`
    )
    await exec.exec(
      'docker',
      ['build', '-f', dockerfile, '-t', imageWithVersion, buildContext],
      { silent: false }
    )
    core.info(`Pushing ${imageWithVersion}...`)
    await exec.exec('docker', ['push', imageWithVersion], { silent: false })
  }

  if (pushWithLatest) {
    const imageLatest = `${qualifiedImage}:latest`
    core.info(`Tagging ${qualifiedImage}:${version} as ${imageLatest}`)
    await exec.exec(
      'docker',
      ['tag', `${qualifiedImage}:${version}`, imageLatest],
      {}
    )
    core.info(`Pushing ${imageLatest}...`)
    await exec.exec('docker', ['push', imageLatest], { silent: false })
  }
}
