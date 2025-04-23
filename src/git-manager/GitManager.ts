import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs/promises'
import { getOctokit } from '@actions/github'
import { GitOptions } from './interfaces/IGitOptions.js'
import { GitDependencies } from './interfaces/IGitDependencies.js'
import { Buffer } from 'buffer'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import * as artifact from '@actions/artifact'

export class GitManager {
  private actor: string
  private token: string
  private repo: string
  private exec: GitDependencies['exec']
  private core: GitDependencies['core']

  constructor(
    options: GitOptions = {},
    dependencies: GitDependencies = { exec, core }
  ) {
    this.actor = options.actor || process.env['GITHUB_ACTOR'] || ''
    this.token = options.token || process.env['GITHUB_TOKEN'] || ''
    this.repo = options.repo || process.env['GITHUB_REPOSITORY'] || ''
    this.exec = dependencies.exec
    this.core = dependencies.core

    if (!this.actor) {
      throw new Error('GITHUB_ACTOR is not defined')
    }
    if (!this.token) {
      throw new Error('GITHUB_TOKEN is not defined')
    }
    if (!this.repo) {
      throw new Error('GITHUB_REPOSITORY is not defined')
    }
  }

  public async initialize(): Promise<void> {
    try {
      await this.configureGit()
    } catch (error) {
      this.core.error(
        `Failed to initialize GitManager: ${(error as Error).message}`
      )
      throw error
    }
  }

  //#region Git Command Execution
  private async execGitCommand(
    args: string[],
    cwd?: string,
    execOptions?: exec.ExecOptions
  ): Promise<void> {
    try {
      const options = cwd ? { cwd, ...execOptions } : execOptions
      await this.exec.exec('git', args, options)
    } catch (error) {
      const errorMessage = `Git command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  // private async getExecGitCommandOutput(
  //   args: string[],
  //   cwd?: string,
  //   execOptions?: exec.ExecOptions
  // ): Promise<string> {
  //   let stdout = ''
  //   const options: exec.ExecOptions = {
  //     ...execOptions,
  //     cwd,
  //     listeners: {
  //       stdout: (data: Buffer) => {
  //         stdout += data.toString()
  //       }
  //     }
  //   }
  //   try {
  //     await this.exec.exec('git', args, options)
  //     return stdout.trim()
  //   } catch (error) {
  //     const errorMessage = `Git command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`
  //     this.core.error(errorMessage)
  //     throw new Error(
  //       `${errorMessage}. Original error: ${(error as Error).message}`
  //     )
  //   }
  // }
  //#endregion

  //#region Git Configuration
  private async configureGit(): Promise<void> {
    try {
      const email = `${this.actor}@users.noreply.github.com`
      await this.execGitCommand(['config', '--global', 'user.name', this.actor])
      await this.execGitCommand(['config', '--global', 'user.email', email])
      this.core.info(`Configured Git for user: ${this.actor}`)
    } catch (error) {
      const errorMessage = 'Failed to configure Git user settings'
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }
  //#endregion

  //#region Repository Operations
  public async cloneRepo(localDir: string): Promise<void> {
    try {
      const repoUrl = `https://${this.actor}:${this.token}@github.com/${this.repo}.git`
      this.core.info(
        `Cloning repository ${this.repo} into directory: ${localDir}`
      )
      await this.execGitCommand(['clone', repoUrl, localDir])
    } catch (error) {
      const errorMessage = `Failed to clone repository ${this.repo} into directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async pullRepo(
    localDir: string,
    branch: string = 'main'
  ): Promise<void> {
    try {
      this.core.info(`Pulling latest changes from branch ${branch}`)
      await this.execGitCommand(['pull', 'origin', branch], localDir)
    } catch (error) {
      const errorMessage = `Failed to pull latest changes from branch ${branch} in directory: ${localDir}. Original error: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  public async pull(): Promise<void> {
    try {
      this.core.info(`Pulling...`)
      await this.execGitCommand(['pull'])
    } catch (error) {
      const errorMessage = `Failed to pull...`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async commitAndPush(
    localDir: string,
    commitMessage: string
  ): Promise<void> {
    try {
      this.core.info('Committing and pushing changes')
      await this.execGitCommand(['add', '.'], localDir)
      await this.execGitCommand(['commit', '-m', commitMessage], localDir)
      await this.execGitCommand(['push', 'origin', 'HEAD'], localDir)
    } catch (error) {
      const errorMessage = `Failed to commit and push changes in directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async createAndCheckoutBranch(
    localDir: string,
    branchName: string
  ): Promise<void> {
    try {
      this.core.info(`Creating and checking out branch ${branchName}`)
      await this.execGitCommand(['checkout', '-b', branchName], localDir)
    } catch (error) {
      const errorMessage = `Failed to create and checkout branch ${branchName} in directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async checkoutBranch(
    localDir: string,
    branchName: string
  ): Promise<void> {
    try {
      this.core.info(`Checking out branch ${branchName}`)
      await this.execGitCommand(['checkout', branchName], localDir)
    } catch (error) {
      const errorMessage = `Failed to checkout branch ${branchName} in directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async mergeBranch(
    localDir: string,
    branchToMerge: string,
    conflictStrategy?: 'ours' | 'theirs'
  ): Promise<void> {
    try {
      this.core.info(`Merging branch ${branchToMerge}`)
      const args = ['merge', branchToMerge]
      if (conflictStrategy) {
        args.push(`-X${conflictStrategy}`)
      }
      await this.execGitCommand(args, localDir)
    } catch (error) {
      const errorMessage = `Failed to merge branch ${branchToMerge} into directory: ${localDir}. Original error: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  public async pushBranch(localDir: string, branchName: string): Promise<void> {
    try {
      this.core.info(`Pushing branch ${branchName}`)
      await this.execGitCommand(['push', '-u', 'origin', branchName], localDir)
    } catch (error) {
      const errorMessage = `Failed to push branch ${branchName} from directory: ${localDir}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async cleanRepo(localDir: string): Promise<void> {
    try {
      this.core.info(`Cleaning repository in directory: ${localDir}`)
      await this.execGitCommand(['clean', '-fdx'], localDir)
    } catch (error) {
      const errorMessage = `Failed to clean repository in directory: ${localDir}. Original error: Git command failed: clean -fdx in directory: ${localDir}. Original error: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  public async restoreRepo(localDir: string): Promise<void> {
    try {
      this.core.info(`Restoring repository in directory: ${localDir}`)
      await this.execGitCommand(['restore', '.'], localDir)
    } catch (error) {
      const errorMessage = `Failed to restore repository in directory: ${localDir}. Original error: Git command failed: restore . in directory: ${localDir}. Original error: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
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
      .map(
        ([label, regex]) =>
          `${label}\n${this.categorize(commits, regex as RegExp)}`
      )
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

    if (keywords.length === 0) return /^$/

    const pattern = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    return new RegExp(`(${pattern})`, 'i')
  }

  private categorize(commits: string, pattern: RegExp): string {
    return (
      commits
        .split('\n')
        .filter((line) => pattern.test(line))
        .join('\n') || 'None'
    )
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
