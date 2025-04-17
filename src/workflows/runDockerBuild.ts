import * as core from '@actions/core'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import { GitManager } from '../git-manager/GitManager.js'
import { InputsManager } from '../inputs-manager/InputsManager.js'

export async function runDockerBuild(): Promise<void> {
  try {
    const inputs = new InputsManager()
    const gitManager = new GitManager()
    const dotnetManager = new DotnetManager()

    let version: string | null = null

    // Determine version based on commit message or .csproj file.
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
      const csprojPath = await dotnetManager.findCsproj(
        inputs.csprojDepth,
        inputs.csprojName
      )
      if (!csprojPath) {
        throw new Error(
          `No .csproj file found with name "${inputs.csprojName}".`
        )
      }
      core.info(`Found .csproj file: ${csprojPath}`)
      const csprojContent = await dotnetManager.readCsproj(csprojPath)
      version = dotnetManager.extractVersion(csprojContent)
      if (!version) {
        core.info('No version found in the .csproj file. Skipping release.')
        core.setOutput('skip', 'true')
        return
      }
    }

    core.info(`Extracted version: ${version}`)
    core.setOutput('version', version)
    core.setOutput('skip', 'false')
  } catch (error) {
    core.error('An error occurred during Docker build.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
