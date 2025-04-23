import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { RepositoryService } from './services/RepositoryService.js'
import { ArtifactService } from './services/ArtifactService.js'
import { ReleaseService } from './services/ReleaseService.js'

export class GitManager {
  private actor: string
  private token: string
  private repository: string
  repo: RepositoryService
  artifact: ArtifactService
  release: ReleaseService

  constructor(
    options: {
      actor?: string
      token?: string
      repo?: string
    } = {},
    dependencies: {
      exec?: typeof exec
      core?: typeof core
    } = {}
  ) {
    this.actor = options.actor || process.env['GITHUB_ACTOR'] || ''
    this.token = options.token || process.env['GITHUB_TOKEN'] || ''
    this.repository = options.repo || process.env['GITHUB_REPOSITORY'] || ''

    if (!this.actor || !this.token || !this.repository) {
      throw new Error(
        'GITHUB_ACTOR, GITHUB_TOKEN, or GITHUB_REPOSITORY is not defined'
      )
    }

    // Automatically initialize Git configuration
    this.initialize().catch((error) => {
      core.error(`Failed to initialize GitManager: ${error.message}`)
      throw error
    })

    this.repo = new RepositoryService(
      { actor: this.actor, token: this.token, repo: this.repository },
      dependencies
    )
    this.artifact = new ArtifactService(dependencies)
    this.release = new ReleaseService(dependencies)
  }

  public async initialize(): Promise<void> {
    const email = `${this.actor}@users.noreply.github.com`
    await exec.exec('git', ['config', '--global', 'user.name', this.actor])
    await exec.exec('git', ['config', '--global', 'user.email', email])
    core.info(`Configured Git for user: ${this.actor}`)
  }

  public async getLatestCommitMessage(): Promise<string> {
    let stdout = ''
    const options: exec.ExecOptions = {
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString()
        }
      }
    }
    await exec.exec('git', ['log', '-1', '--pretty=%B'], {
      listeners: options.listeners
    })
    return stdout.trim()
  }

  public async updateVersion(
    newVersion: string,
    csprojPath: string,
    commitUser: string,
    commitEmail: string,
    commitMessagePrefix: string
  ): Promise<void> {
    await exec.exec('git', ['config', 'user.name', commitUser])
    await exec.exec('git', ['config', 'user.email', commitEmail])
    await exec.exec('git', ['add', csprojPath])
    const commitMessage = `${commitMessagePrefix} Bump version to ${newVersion}`
    await exec.exec('git', ['commit', '-m', commitMessage])
    await exec.exec('git', ['push', 'origin', 'HEAD'])
    core.info(`Version updated to ${newVersion} and pushed to remote.`)
  }
}
