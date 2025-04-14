import * as core from '@actions/core'
import {
  getLatestCommitSubject,
  extractVersionFromCommit
} from './utils/git.js'
import { getActionInput } from './utils/inputs.js'
import { generateChangelog } from './utils/release-changelog.js'
import { releaseExists, createRelease } from './utils/release.js'
import { findCsprojFile, extractVersionFromCsproj } from './utils/csproj.js'
import * as fs from 'fs/promises'

export async function run(): Promise<void> {
  try {
    const token = process.env.GH_TOKEN || ''
    const repo = process.env.GITHUB_REPOSITORY || ''
    if (!repo) throw new Error('GITHUB_REPOSITORY is not defined.')

    const useCommitMessage =
      getActionInput('use_commit_message', 'true').toLowerCase() === 'true'
    let version: string | null = null

    if (useCommitMessage) {
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
      const csprojDepth = Number(getActionInput('csproj_depth', '3'))
      const csprojName = getActionInput('csproj_name', '*.csproj')
      core.info(
        `Searching for csproj file with pattern "${csprojName}" at max depth ${csprojDepth}`
      )
      const csprojPath = await findCsprojFile(csprojDepth, csprojName)
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

    const changelog = await generateChangelog()
    core.setOutput('changelog', changelog)

    const exists = await releaseExists(repo, version, token)
    if (exists) {
      core.info(`Release v${version} already exists. Skipping creation.`)
      return
    }

    await createRelease(repo, version, changelog, token)
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
