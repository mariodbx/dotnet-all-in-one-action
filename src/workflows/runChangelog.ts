import * as core from '@actions/core'
import { generateChangelog, createRelease } from '../utils/release.js'
import { runDockerPush, checkGhcrImageExists } from './runDockerPush.js'
import { getInputs } from '../utils/inputs.js'
import {
  findCsprojFile,
  readCsprojFile,
  extractVersion
} from '../utils/csproj.js'

export async function runChangelog(): Promise<void> {
  try {
    const inputs = getInputs()

    if (!inputs.runChangelog && !inputs.includeGhcrPackage) {
      core.info(
        'Changelog generation and GHCR package inclusion are disabled. Skipping...'
      )
      return
    }

    let changelog = ''

    let version = ''
    if (!version) {
      core.info(
        'Version is not provided in inputs. Attempting to read from .csproj...'
      )
      try {
        const csprojPath = await findCsprojFile(
          inputs.csprojDepth,
          inputs.csprojName
        )
        const csprojContent = await readCsprojFile(csprojPath)
        version = extractVersion(csprojContent)
        core.info(`Version extracted from .csproj: ${version}`)
      } catch (error) {
        throw new Error(`Failed to retrieve version from .csproj: ${error}`)
      }
    }

    if (inputs.includeGhcrPackage) {
      core.info('Including GHCR package...')
      const repo = process.env.GITHUB_REPOSITORY || ''
      if (!repo) {
        throw new Error('GITHUB_REPOSITORY is not defined.')
      }

      const imageName = `${repo}/${inputs.dockerfileImages}:${version}`
      const imageExists = await checkGhcrImageExists(imageName)

      if (imageExists) {
        core.info(`GHCR package image ${imageName} already exists.`)
      } else {
        core.info(`GHCR package image ${imageName} does not exist. Pushing...`)
        await runDockerPush()
      }

      core.info('Generating changelog with GHCR package details...')
      changelog = await generateChangelog()

      // Add GHCR package image details to the changelog
      changelog += `\n\n### GHCR Package\n- Image: \`${imageName}\``
      core.info('GHCR package image details added to the changelog.')
    } else if (inputs.runChangelog) {
      core.info('Generating changelog...')
      changelog = await generateChangelog()
    }

    if (inputs.includeDotnetBinaries) {
      core.info('Including .NET binaries in the changelog...')
      const binaryPaths = [
        './publish/linux',
        './publish/windows',
        './publish/macos'
      ]
      const binaryDetails = binaryPaths
        .map((path) => `- Published binaries available at: ${path}`)
        .join('\n')
      changelog += `\n\n### .NET Binaries\n${binaryDetails}`
      core.info('.NET binaries paths added to the changelog.')
    }

    if (inputs.runRelease) {
      core.info('Creating release...')
      const token = process.env.GITHUB_TOKEN || ''
      const repo = process.env.GITHUB_REPOSITORY || ''
      if (!repo || !version) {
        throw new Error('GITHUB_REPOSITORY or version is not defined.')
      }
      await createRelease(repo, version, changelog, token)
    }

    core.info('Changelog and release process completed successfully.')
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
