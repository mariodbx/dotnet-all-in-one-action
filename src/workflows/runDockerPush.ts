import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Inputs } from '../Inputs.js'
import { DockerManager } from '../docker-manager/DockerManager.js'
import { Csproj } from '../utils/Csproj.js'

export async function checkGhcrImageExists(
  imageName: string
): Promise<boolean> {
  try {
    await exec.exec('docker', ['pull', imageName], { silent: true })
    return true
  } catch {
    return false
  }
}

export async function runDockerPush(): Promise<void> {
  try {
    const inputs = new Inputs()
    const dockerManager = new DockerManager(inputs.registryType)

    // Log into Docker registry using DockerManager.
    await dockerManager.login(false)

    // Extract version from the .csproj file.
    const csprojPath = await Csproj.findCsproj(
      inputs.csprojDepth,
      inputs.csprojName
    )
    if (!csprojPath) {
      throw new Error(`No .csproj file found with name "${inputs.csprojName}".`)
    }
    core.info(`Found .csproj file: ${csprojPath}`)
    const csprojContent = await Csproj.readCsproj(csprojPath)
    const newVersion = Csproj.extractVersion(csprojContent)

    // Ensure the full version, including the build number, is extracted.
    if (!newVersion || !/^\d+\.\d+\.\d+(\.\d+)?$/.test(newVersion)) {
      core.error('Invalid or incomplete version extracted from .csproj file.')
      core.setFailed('A valid version (including build number) is required.')
      return
    }

    core.info(`New version (including build number): ${newVersion}`)

    // Process Docker Compose builds if provided.
    if (inputs.dockerComposeFiles) {
      if (!inputs.images) {
        throw new Error(
          'Input "images" is required when using Docker Compose files.'
        )
      }
      const dcFiles = inputs.dockerComposeFiles
        .split(',')
        .map((file) => file.trim())
        .filter((file) => file)
      const composeImages = inputs.images
        .split(',')
        .map((img) => dockerManager.qualifyImageName(img.trim()))
        .filter((img) => img)

      for (const file of dcFiles) {
        core.info(`Processing Docker Compose file: ${file}`)
        await dockerManager.buildCompose(file)
        await dockerManager.pushCompose(
          newVersion,
          composeImages,
          inputs.pushWithVersion,
          inputs.pushWithLatest
        )
      }
    }

    // Process Dockerfile builds if provided.
    if (inputs.dockerfiles) {
      if (!inputs.dockerfileImages) {
        throw new Error(
          'Input "dockerfile_images" is required when using Dockerfiles.'
        )
      }
      const dockerfiles = inputs.dockerfiles
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f)
      const dockerfileImages = inputs.dockerfileImages
        .split(',')
        .map((img) => dockerManager.qualifyImageName(img.trim()))
        .filter((img) => img)
      const contexts = inputs.dockerfileContexts
        ? inputs.dockerfileContexts
            .split(',')
            .map((c) => c.trim())
            .filter((c) => c)
        : dockerfiles.map(() => '.')

      if (
        dockerfiles.length !== dockerfileImages.length ||
        dockerfiles.length !== contexts.length
      ) {
        throw new Error(
          'The number of Dockerfiles, dockerfile_images, and dockerfile_contexts must be the same.'
        )
      }

      for (let i = 0; i < dockerfiles.length; i++) {
        core.info(
          `Processing Dockerfile: ${dockerfiles[i]} with context: ${contexts[i]} and image: ${dockerfileImages[i]}`
        )
        const imageWithVersion = await dockerManager.buildDocker(
          dockerfiles[i],
          contexts[i],
          newVersion,
          dockerfileImages[i]
        )
        await dockerManager.pushDocker(imageWithVersion, inputs.pushWithLatest)
      }
    }

    core.info('Docker push steps completed successfully.')
  } catch (error) {
    core.error('An error occurred during Docker push.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
