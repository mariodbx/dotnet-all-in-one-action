import * as core from '@actions/core'
import {
  getLatestCommitSubject,
  extractVersionFromCommit
} from './utils/git.js'
import { findCsprojFile, extractVersionFromCsproj } from './utils/csproj.js'
import { releaseExists, createRelease } from './utils/release.js'
import { getInputs } from './utils/inputs.js'
import * as fs from 'fs/promises'

export async function runRelease(): Promise<void> {
  try {
    const inputs = getInputs()

    const token = process.env.GHCR_TOKEN || ''
    const repo = process.env.GITHUB_REPOSITORY || ''
    if (!repo) throw new Error('GITHUB_REPOSITORY is not defined.')

    let version: string | null = null

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
      core.info(
        `Searching for csproj file with pattern "${inputs.csprojName}" at max depth ${inputs.csprojDepth}`
      )
      const csprojPath = await findCsprojFile(
        inputs.csprojDepth,
        inputs.csprojName
      )
      core.info(`Found csproj file at: ${csprojPath}`)
      const csprojContent = await fs.readFile(csprojPath, 'utf8')
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

    const exists = await releaseExists(repo, version, token)
    if (exists) {
      core.info(`Release v${version} already exists. Skipping creation.`)
      return
    }

    await createRelease(repo, version, '', token) // Changelog will be handled separately.
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
