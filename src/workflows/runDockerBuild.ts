import * as core from '@actions/core'
import { Inputs } from '../utils/Inputs.js'
import { DockerManager } from '../docker-manager/DockerManager.js'

export async function runDockerBuild(): Promise<void> {
  const inputs = new Inputs()

  const dockerManager = new DockerManager(inputs.registryType)

  // Login to the registry
  await dockerManager.login()

  if (inputs.dockerComposeFiles) {
    // Build using Docker Compose
    const composeFiles = inputs.dockerComposeFiles.split(',')
    for (const composeFile of composeFiles) {
      const trimmedComposeFile = composeFile.trim()
      core.info(`Building using Docker Compose file: ${trimmedComposeFile}`)
      await dockerManager.buildCompose(trimmedComposeFile)
    }
  } else {
    // Build individual Docker images
    const dockerfiles = inputs.dockerfiles.split(',')
    const contexts = inputs.dockerfileContexts.split(',')
    const images = inputs.dockerfileImages.split(',')

    if (
      dockerfiles.length !== contexts.length ||
      contexts.length !== images.length
    ) {
      throw new Error(
        'Mismatch between the number of dockerfiles, contexts, and images. Ensure they are aligned.'
      )
    }

    for (let i = 0; i < dockerfiles.length; i++) {
      const dockerfile = dockerfiles[i].trim()
      const context = contexts[i].trim()
      const image = images[i].trim()

      core.info(`Building Docker image for: ${image}`)
      const imageWithVersion = await dockerManager.buildDocker(
        dockerfile,
        context,
        inputs.version,
        image
      )
      core.info(`Successfully built: ${imageWithVersion}`)
    }
  }
}
