import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IRegistry } from './interfaces/IRegistry.js'
import { RegistryFactory } from './registries/RegistryFactory.js'

export class DockerManager {
  private registry: IRegistry

  constructor(registryType: string) {
    this.registry = RegistryFactory.createRegistry(registryType)
  }

  async login(showFullOutput: boolean = false): Promise<void> {
    core.info('Logging into the registry...')
    await this.registry.login(showFullOutput)
  }

  async buildDocker(
    dockerfile: string,
    buildContext: string,
    version: string,
    image: string
  ): Promise<string> {
    const qualifiedImage = this.registry.qualifyImageName(image)
    const imageWithVersion = `${qualifiedImage}:${version}`
    core.info(
      `Building image ${imageWithVersion} from Dockerfile: ${dockerfile}`
    )
    await exec.exec(
      'docker',
      ['build', '-f', dockerfile, '-t', imageWithVersion, buildContext],
      { silent: false }
    )
    return imageWithVersion
  }

  async pushDocker(
    imageWithVersion: string,
    pushWithLatest: boolean
  ): Promise<void> {
    core.info(`Pushing ${imageWithVersion}...`)
    await exec.exec('docker', ['push', imageWithVersion], { silent: false })

    if (pushWithLatest) {
      const imageLatest = `${imageWithVersion.split(':')[0]}:latest`
      core.info(`Tagging ${imageWithVersion} as ${imageLatest}`)
      await exec.exec('docker', ['tag', imageWithVersion, imageLatest], {})
      core.info(`Pushing ${imageLatest}...`)
      await exec.exec('docker', ['push', imageLatest], { silent: false })
    }
  }

  async buildCompose(dockerComposeFile: string): Promise<void> {
    core.info(`Building using Docker Compose file: ${dockerComposeFile}`)
    await exec.exec('docker-compose', ['-f', dockerComposeFile, 'build'], {})
  }

  async pushCompose(
    version: string,
    images: string[],
    pushWithVersion: boolean,
    pushWithLatest: boolean
  ): Promise<void> {
    if (pushWithVersion) {
      core.info(`Pushing images (version tag "${version}")...`)
      for (const image of images) {
        const qualifiedImage = this.registry.qualifyImageName(image)
        const imageWithVersion = `${qualifiedImage}:${version}`
        await exec.exec('docker', ['push', imageWithVersion], {})
      }
    }

    if (pushWithLatest) {
      for (const image of images) {
        const qualifiedImage = this.registry.qualifyImageName(image)
        const imageWithVersion = `${qualifiedImage}:${version}`
        const imageLatest = `${qualifiedImage}:latest`
        core.info(`Tagging ${imageWithVersion} as ${imageLatest}`)
        await exec.exec('docker', ['tag', imageWithVersion, imageLatest], {})
        await exec.exec('docker', ['push', imageLatest], {})
      }
    }
  }

  async dockerizeProject(
    projectPath: string,
    imageName: string,
    port: string,
    baseImage: string
  ): Promise<void> {
    core.info(`Initializing Docker for the .NET project at: ${projectPath}`)
    await exec.exec(
      'docker',
      [
        'init',
        '--project-directory',
        projectPath,
        '--image-name',
        imageName,
        '--port',
        port,
        '--base-image',
        baseImage
      ],
      { silent: false }
    )
    core.info('Docker initialization completed.')
  }
}
