// runRelease.ts
import * as core from '@actions/core'
import { Timer } from '../utils/Timer.js'
import { InputsManager } from '../inputs-manager/InputsManager.js'
import { GitManager } from '../git-manager/GitManager.js'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'

export async function runRelease(): Promise<void> {
  try {
    const inputs = new InputsManager()
    const gitManager = new GitManager()
    const dotnetManager = new DotnetManager()

    // const token = process.env.GITHUB_TOKEN || ''
    const repo = process.env.GITHUB_REPOSITORY || ''
    if (!repo) throw new Error('GITHUB_REPOSITORY is not defined.')

    let version: string | null = null

    core.info('Waiting for 5 seconds before ensuring the latest version...')
    await Timer.wait(5000)

    core.info('Running git pull to fetch the latest version...')
    await gitManager.pullRepo('.', 'main')

    // Determine version based on configuration.
    if (inputs.useCommitMessage) {
      const commitSubject = await gitManager.getLatestCommitMessage()
      core.info(`Latest commit subject: "${commitSubject}"`)
      version = gitManager.extractVersionFromCommit(commitSubject)
      if (!version) {
        core.info(
          'No version bump detected in commit message. Skipping release.'
        )
        core.setOutput('skip', 'true')
        return
      }
    } else {
      core.info(
        `Searching for .csproj file with pattern "${inputs.csprojName}" at max depth ${inputs.csprojDepth}`
      )
      const csprojPath = await dotnetManager.findCsproj(
        inputs.csprojDepth,
        inputs.csprojName
      )
      if (!csprojPath) {
        throw new Error(
          `No .csproj file found with name "${inputs.csprojName}".`
        )
      }
      core.info(`Found .csproj file at: ${csprojPath}`)
      const csprojContent = await dotnetManager.readCsproj(csprojPath)
      version = dotnetManager.extractVersion(csprojContent)
      if (!version) {
        core.info('No version found in the .csproj file. Skipping release.')
        core.setOutput('skip', 'true')
        return
      }
    }

    core.info(`Extracted version: ${version}`)
    // Set outputs for downstream jobs.
    core.setOutput('version', version)
    core.setOutput('skip', 'false')

    // Check if a release for this version already exists.
    const exists = await gitManager.releaseExists(repo, version)
    if (exists) {
      core.info(`Release v${version} already exists. Skipping creation.`)
      return
    }

    // Create a new release (changelog is left empty; it will be added later by runChangelog).
    await gitManager.createRelease(repo, version, '')
    core.info(`Release v${version} created successfully.`)
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
