import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs/promises'
import { getOctokit } from '@actions/github'
import { Buffer } from 'buffer'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import * as artifact from '@actions/artifact'

export function createGitManager(
  options: {
    actor?: string
    token?: string
    repo?: string
  } = {},
  dependencies = { exec, core }
) {
  const actor = options.actor || process.env['GITHUB_ACTOR'] || ''
  const token = options.token || process.env['GITHUB_TOKEN'] || ''
  const repo = options.repo || process.env['GITHUB_REPOSITORY'] || ''

  if (!actor) {
    throw new Error('GITHUB_ACTOR is not defined')
  }
  if (!token) {
    throw new Error('GITHUB_TOKEN is not defined')
  }
  if (!repo) {
    throw new Error('GITHUB_REPOSITORY is not defined')
  }

  async function initialize(): Promise<void> {
    try {
      await configureGit()
    } catch (error) {
      core.error(`Failed to initialize GitManager: ${(error as Error).message}`)
      throw error
    }
  }

  async function configureGit(): Promise<void> {
    try {
      const email = `${actor}@users.noreply.github.com`
      await exec.exec('git', ['config', '--global', 'user.name', actor])
      await exec.exec('git', ['config', '--global', 'user.email', email])
      core.info(`Configured Git for user: ${actor}`)
    } catch (error) {
      const errorMessage = 'Failed to configure Git user settings'
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function cloneRepo(localDir: string): Promise<void> {
    try {
      const repoUrl = `https://${actor}:${token}@github.com/${repo}.git`
      core.info(`Cloning repository ${repo} into directory: ${localDir}`)
      await exec.exec('git', ['clone', repoUrl, localDir])
    } catch (error) {
      const errorMessage = `Failed to clone repository ${repo} into directory: ${localDir}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function pullRepo(
    localDir: string,
    branch: string = 'main'
  ): Promise<void> {
    try {
      core.info(`Pulling latest changes from branch ${branch}`)
      await exec.exec('git', ['pull', 'origin', branch], { cwd: localDir })
    } catch (error) {
      const errorMessage = `Failed to pull latest changes from branch ${branch} in directory: ${localDir}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function pull(): Promise<void> {
    try {
      core.info(`Pulling...`)
      await exec.exec('git', ['pull'])
    } catch (error) {
      const errorMessage = `Failed to pull...`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function commitAndPush(
    localDir: string,
    commitMessage: string
  ): Promise<void> {
    try {
      core.info('Committing and pushing changes')
      await exec.exec('git', ['add', '.'], { cwd: localDir })
      await exec.exec('git', ['commit', '-m', commitMessage], { cwd: localDir })
      await exec.exec('git', ['push', 'origin', 'HEAD'], { cwd: localDir })
    } catch (error) {
      const errorMessage = `Failed to commit and push changes in directory: ${localDir}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function createAndCheckoutBranch(
    localDir: string,
    branchName: string
  ): Promise<void> {
    try {
      core.info(`Creating and checking out branch ${branchName}`)
      await exec.exec('git', ['checkout', '-b', branchName], { cwd: localDir })
    } catch (error) {
      const errorMessage = `Failed to create and checkout branch ${branchName} in directory: ${localDir}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function getLatestCommitMessage(): Promise<string> {
    try {
      const { stdout } = await exec.getExecOutput('git', [
        'log',
        '-1',
        '--pretty=%B'
      ])
      return stdout.trim()
    } catch (error) {
      const errorMessage = 'Failed to get the latest commit message'
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async function generateChangelog(inputs: {
    majorKeywords: string
    minorKeywords: string
    patchKeywords: string
    hotfixKeywords: string
    addedKeywords: string
    devKeywords: string
  }): Promise<string> {
    let lastTag = ''
    try {
      const { stdout } = await exec.getExecOutput('git', [
        'describe',
        '--tags',
        '--abbrev=0'
      ])
      lastTag = stdout.trim()
      core.info(`Found last tag: ${lastTag}`)
    } catch {
      core.info('No tags found, using all commits.')
    }

    const range = lastTag ? `${lastTag}..HEAD` : ''
    const { stdout: commits } = await exec.getExecOutput('git', [
      'log',
      ...(range ? [range] : []),
      '--no-merges',
      '--pretty=format:%h %s'
    ])

    const changelog = [
      ['### Major Changes', buildKeywordRegex(inputs.majorKeywords)],
      ['### Minor Changes', buildKeywordRegex(inputs.minorKeywords)],
      ['### Patch/Bug Fixes', buildKeywordRegex(inputs.patchKeywords)],
      ['### Hotfixes', buildKeywordRegex(inputs.hotfixKeywords)],
      ['### Additions', buildKeywordRegex(inputs.addedKeywords)],
      ['### Dev Changes', buildKeywordRegex(inputs.devKeywords)]
    ]
      .map(([label, regex]) => {
        const categorizedCommits = categorize(commits, regex as RegExp)
        return `${label}\n${categorizedCommits}`
      })
      .join('\n\n')

    await fs.writeFile('changelog.txt', changelog, 'utf8')
    core.info('Generated changelog:\n' + changelog)
    return changelog
  }

  function buildKeywordRegex(keywordsInput: string): RegExp {
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    if (keywords.length === 0) return /.*/ // Match all if no keywords provided.

    const pattern = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    return new RegExp(`\\b(${pattern})\\b`, 'i') // Ensure whole-word matching.
  }

  function categorize(commits: string, pattern: RegExp): string {
    const filteredCommits = commits
      .split('\n')
      .filter((line) => pattern.test(line))
      .join('\n')
    return filteredCommits || 'None'
  }

  async function uploadArtifact(
    artifactName: string,
    resultFilePath: string,
    resultFolder: string,
    retentionDays: number
  ): Promise<void> {
    if (
      await fs
        .access(resultFilePath)
        .then(() => true)
        .catch(() => false)
    ) {
      core.info(`Uploading artifact from ${resultFilePath}...`)
      const artifactClient = new artifact.DefaultArtifactClient()

      try {
        const { id, size } = await artifactClient.uploadArtifact(
          artifactName,
          [resultFilePath],
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async cleanRepo(localDir: string): Promise<void> {
    try {
      this.core.info(`Cleaning repository in directory: ${localDir}`)
      await this.execGitCommand(['clean', '-fdx'], localDir)
    } catch (error) {
      const errorMessage = `Failed to clean repository in directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async restoreRepo(localDir: string): Promise<void> {
    try {
      this.core.info(`Restoring repository in directory: ${localDir}`)
      await this.execGitCommand(['restore', '.'], localDir)
    } catch (error) {
      const errorMessage = `Failed to restore repository in directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }
  //#endregion

  //#region Utility Methods
  public async getLatestCommitMessage(): Promise<string> {
    let stdout = ''
    const options: exec.ExecOptions = {
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString()
        }
      }
    }
    await this.execGitCommand(['log', '-1', '--pretty=%B'], undefined, options)
    return stdout.trim()
  }

  public async updateVersion(
    newVersion: string,
    csprojPath: string,
    commitUser: string,
    commitEmail: string,
    commitMessagePrefix: string
  ): Promise<void> {
    await this.execGitCommand(['config', 'user.name', commitUser])
    await this.execGitCommand(['config', 'user.email', commitEmail])
    await this.execGitCommand(['add', csprojPath])
    const commitMessage = `${commitMessagePrefix} Bump version to ${newVersion}`
    await this.execGitCommand(['commit', '-m', commitMessage])
    await this.execGitCommand(['push', 'origin', 'HEAD'])
    this.core.info(`Version updated to ${newVersion} and pushed to remote.`)
  }

  public async createRelease(
    repo: string,
    tag: string,
    changelog: string
  ): Promise<RestEndpointMethodTypes['repos']['createRelease']['response']> {
    const [owner, repoName] = repo.split('/')
    const octokit = getOctokit(this.token)
    this.core.info(`Creating release for tag ${tag}...`)
    const response = await octokit.rest.repos.createRelease({
      owner,
      repo: repoName,
      tag_name: tag,
      name: tag,
      body: changelog,
      draft: false,
      prerelease: false
    })
    this.core.info(`Release created with ID ${response.data.id}.`)
    return response
  }

  public async uploadAssets(
    owner: string,
    repo: string,
    releaseId: number,
    assets: { name: string; path: string }[]
  ): Promise<void> {
    const octokit = getOctokit(this.token)
    for (const asset of assets) {
      try {
        this.core.info(`Uploading asset: ${asset.name} from ${asset.path}...`)
        const fileContent = await fs.readFile(asset.path)
        const stat = await fs.stat(asset.path)
        await octokit.rest.repos.uploadReleaseAsset({
          owner,
          repo,
          release_id: releaseId,
          name: asset.name,
          data: fileContent.toString(),
          headers: {
            'content-length': stat.size,
            'content-type': 'application/octet-stream'
          }
        })
        this.core.info(`Asset ${asset.name} uploaded successfully.`)
      } catch (error) {
        const errorMessage = `Failed to upload asset ${asset.name} from ${asset.path}`
        this.core.error(errorMessage)
        throw new Error(
          `${errorMessage}. Original error: ${(error as Error).message}`
        )
      }
    }
  }

  public async generateChangelog(inputs: {
    majorKeywords: string
    minorKeywords: string
    patchKeywords: string
    hotfixKeywords: string
    addedKeywords: string
    devKeywords: string
  }): Promise<string> {
    let lastTag = ''
    try {
      const { stdout } = await exec.getExecOutput('git', [
        'describe',
        '--tags',
        '--abbrev=0'
      ])
      lastTag = stdout.trim()
      this.core.info(`Found last tag: ${lastTag}`)
    } catch {
      this.core.info('No tags found, using all commits.')
    }

    const range = lastTag ? `${lastTag}..HEAD` : ''
    const { stdout: commits } = await exec.getExecOutput('git', [
      'log',
      ...(range ? [range] : []),
      '--no-merges',
      '--pretty=format:%h %s'
    ])

    const changelog = [
      ['### Major Changes', this.buildKeywordRegex(inputs.majorKeywords)],
      ['### Minor Changes', this.buildKeywordRegex(inputs.minorKeywords)],
      ['### Patch/Bug Fixes', this.buildKeywordRegex(inputs.patchKeywords)],
      ['### Hotfixes', this.buildKeywordRegex(inputs.hotfixKeywords)],
      ['### Additions', this.buildKeywordRegex(inputs.addedKeywords)],
      ['### Dev Changes', this.buildKeywordRegex(inputs.devKeywords)]
    ]
      .map(([label, regex]) => {
        const categorizedCommits = this.categorize(commits, regex as RegExp)
        return `${label}\n${categorizedCommits}`
      })
      .join('\n\n')

    await fs.writeFile('changelog.txt', changelog, 'utf8')
    this.core.info('Generated changelog:\n' + changelog)
    return changelog
  }

  private buildKeywordRegex(keywordsInput: string): RegExp {
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    if (keywords.length === 0) return /.*/ // Match all if no keywords provided.

    const pattern = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    return new RegExp(`\\b(${pattern})\\b`, 'i') // Ensure whole-word matching.
  }

  private categorize(commits: string, pattern: RegExp): string {
    const filteredCommits = commits
      .split('\n')
      .filter((line) => pattern.test(line))
      .join('\n')
    return filteredCommits || 'None'
  }

  public async releaseExists(repo: string, version: string): Promise<boolean> {
    const url = `https://api.github.com/repos/${repo}/releases/tags/v${version}`
    const response = await fetch(url, {
      headers: { Authorization: `token ${this.token}` }
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Failed to check release existence: ${response.status} ${response.statusText}`
      )
    }

    return response.status === 200
  }

  public extractVersionFromCommit(commitMessage: string): string | null {
    const versionRegex = /version\s(\d+\.\d+\.\d+)/i
    const match = commitMessage.match(versionRegex)
    return match ? match[1] : null
  }
  //#endregion

  //#region Artifact Management
  private async uploadArtifact(
    artifactName: string,
    resultFilePath: string,
    resultFolder: string,
    retentionDays: number
  ): Promise<void> {
    if (
      await fs
        .access(resultFilePath)
        .then(() => true)
        .catch(() => false)
    ) {
      this.core.info(`Uploading artifact from ${resultFilePath}...`)
      const artifactClient = new artifact.DefaultArtifactClient()

      try {
        const { id, size } = await artifactClient.uploadArtifact(
          artifactName,
          [resultFilePath],
          resultFolder,
          { retentionDays }
        )
        this.core.info(`Created artifact with id: ${id} (bytes: ${size})`)
      } catch (uploadError: unknown) {
        if (uploadError instanceof Error) {
          this.core.error(`Failed to upload artifact: ${uploadError.message}`)
        } else {
          this.core.error('Failed to upload artifact due to an unknown error.')
        }
      }
    } else {
      this.core.info('No file found to upload as an artifact.')
    }
  }

  public async uploadTestArtifact(
    resultFilePath: string,
    resultFolder: string
  ): Promise<void> {
    const artifactName = 'test-results'
    const retentionDays = 7
    await this.uploadArtifact(
      artifactName,
      resultFilePath,
      resultFolder,
      retentionDays
    )
  }
  //#endregion
}
