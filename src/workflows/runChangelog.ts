// runChangelog.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { wait } from '../utils/wait.js'
import { generateChangelog, createRelease } from '../utils/release.js'
import { runDockerPush, checkGhcrImageExists } from './runDockerPush.js'
import { getInputs } from '../utils/inputs.js'
import {
  findCsprojFile,
  readCsprojFile,
  extractVersion
} from '../utils/csproj.js'
import { zipDirectory, uploadReleaseAssets } from '../utils/uploadAssets.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getOctokit } from '@actions/github'

/**
 * Retrieves an existing release for the given version.
 */
async function getExistingRelease(
  token: string,
  owner: string,
  repo: string,
  tag: string
) {
  const octokit = getOctokit(token)
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner,
    repo
  })
  return releases.find((release) => release.tag_name === tag)
}

export async function runChangelog(): Promise<void> {
  try {
    const inputs = getInputs()

    if (!inputs.runChangelog && !inputs.includeGhcrPackage) {
      core.info(
        'Changelog generation and GHCR package inclusion are disabled. Skipping...'
      )
      return
    }

    core.info('Waiting for 5 seconds before ensuring the latest version...')
    await wait(5000)

    core.info('Running git pull to fetch the latest version...')
    await exec.exec('git', ['pull'])

    let changelog = ''
    let version = ''
    // Always read version from the csproj to ensure consistency.
    core.info(
      'Version not provided in inputs. Attempting to read from .csproj...'
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

    let imageName = ''
    if (inputs.includeGhcrPackage) {
      core.info('Including GHCR package...')
      const repoEnv = process.env.GITHUB_REPOSITORY || ''
      if (!repoEnv) throw new Error('GITHUB_REPOSITORY is not defined.')
      imageName = `${repoEnv}/${inputs.dockerfileImages}:${version}`

      const imageExists = await checkGhcrImageExists(imageName)
      if (imageExists) {
        core.info(`GHCR package image ${imageName} already exists.`)
      } else {
        core.info(`GHCR package image ${imageName} does not exist. Pushing...`)
        await runDockerPush()
      }
      core.info('Generating changelog with GHCR package details...')
      changelog = await generateChangelog()
      // Append GHCR package details as text in the changelog for reference.
      changelog += `\n\n### GHCR Package\n- Image: \`${imageName}\``
      core.info('GHCR package details added to changelog.')
    } else if (inputs.runChangelog) {
      core.info('Generating changelog...')
      changelog = await generateChangelog()
    }

    // Append .NET binaries paths to the changelog if included.
    if (inputs.includeDotnetBinaries) {
      core.info('Including .NET binaries in the changelog...')
      const binaryPaths = [
        './publish/linux',
        './publish/windows',
        './publish/macos'
      ]
      const binaryDetails = binaryPaths
        .map((binPath) => `- Published binaries available at: ${binPath}`)
        .join('\n')
      changelog += `\n\n### .NET Binaries\n${binaryDetails}`
      core.info('Binary paths added to changelog.')
    }

    const token = process.env.GITHUB_TOKEN || ''
    const repoFull = process.env.GITHUB_REPOSITORY || ''
    if (!repoFull || !version) {
      throw new Error('GITHUB_REPOSITORY or version is not defined.')
    }
    const [owner, repoName] = repoFull.split('/')

    // Retrieve the release either via getExistingRelease or create it if the runRelease flag is enabled.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let releaseResponse: any = await getExistingRelease(
      token,
      owner,
      repoName,
      version
    )
    if (!releaseResponse && inputs.runRelease) {
      core.info('Release does not exist. Creating release...')
      releaseResponse = await createRelease(repoFull, version, changelog, token)
      core.info(`Release created with ID ${releaseResponse.data.id}.`)
    } else if (!releaseResponse) {
      // If no release exists and runRelease is false, skip asset upload.
      core.info(
        'No existing release found and release creation not enabled; skipping asset upload.'
      )
      return
    } else {
      core.info(
        `Found existing release for version ${version} with ID ${releaseResponse.id || releaseResponse.data.id}.`
      )
    }

    // Prepare assets for upload.
    const assets: { name: string; path: string }[] = []

    // Zip binaries for each supported platform.
    if (inputs.includeDotnetBinaries) {
      core.info('Zipping binary assets...')
      const platforms = [
        { name: 'linux', dir: './publish/linux' },
        { name: 'windows', dir: './publish/windows' },
        { name: 'macos', dir: './publish/macos' }
      ]
      for (const platform of platforms) {
        // Define the zip output path, e.g., "./publish/linux.zip".
        const zipPath = path.join('./publish', `${platform.name}.zip`)
        await zipDirectory(platform.dir, zipPath)
        assets.push({ name: `${platform.name}.zip`, path: zipPath })
      }
    }

    // Create a text file asset for GHCR details if requested.
    if (inputs.includeGhcrPackage) {
      core.info('Creating GHCR details asset...')
      const ghcrDetailsPath = './ghcr-details.txt'
      const content = `GHCR Image: ${imageName}\nYou can pull the image using:\ndocker pull ${imageName}\n`
      await fs.writeFile(ghcrDetailsPath, content, 'utf8')
      assets.push({ name: 'ghcr-details.txt', path: ghcrDetailsPath })
    }

    // Upload the assets to the release.
    if (assets.length > 0) {
      const releaseId = releaseResponse.id || releaseResponse.data.id
      core.info(
        `Uploading ${assets.length} assets to release ID ${releaseId}...`
      )
      await uploadReleaseAssets(token, owner, repoName, releaseId, assets)
      core.info('All assets have been successfully uploaded.')
    } else {
      core.info('No assets to upload.')
    }

    core.info(
      'Changelog and release asset upload process completed successfully.'
    )
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}

// Immediately run the function if this script is invoked directly.
runChangelog()
