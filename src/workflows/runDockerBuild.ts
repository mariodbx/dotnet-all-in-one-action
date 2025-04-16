import * as core from '@actions/core'
import * as fs from 'fs/promises'
import { findCsprojFile, extractVersionFromCsproj } from '../utils/csproj.js'
import {
  getLatestCommitSubject,
  extractVersionFromCommit
} from '../utils/git.js'
import { getInputs } from '../utils/inputs.js'

export async function runDockerBuild(): Promise<void> {
  try {
    const inputs = getInputs()

    let version: string | null = null

    // Determine version based on commit message or .csproj file.
    if (inputs.useCommitMessage) {
      const commitSubject = await getLatestCommitSubject()
      core.info(`Latest commit subject: "${commitSubject}"`)
      version = extractVersionFromCommit(commitSubject)
      if (!version) {
        core.info(
          'No version bump detected in commit message. Skipping release.'
        )
        core.setOutput('skip', 'true')
        return
      }
    } else {
      const csprojPath = await findCsprojFile(
        inputs.csprojDepth,
        inputs.csprojName
      )
      if (!csprojPath || csprojPath.trim() === '') {
        throw new Error(
          `No .csproj file found with name "${inputs.csprojName}".`
        )
      }
      core.info(`Found .csproj file: ${csprojPath.trim()}`)
      const csprojContent = await fs.readFile(csprojPath.trim(), 'utf8')
      version = extractVersionFromCsproj(csprojContent)
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
