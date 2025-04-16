import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as process from 'process'

/**
 * Interface defining the contract for Git operations.
 */
export interface IGitHelper {
  /**
   * Configures Git user information.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the configuration is complete.
   * @example
   * await gitHelper.configureGit({ actor: 'username', token: 'token' });
   * @remarks
   * This method ensures that Git is configured with a username and email.
   */
  configureGit(options?: GitOptions): Promise<void>

  /**
   * Clones a repository using the provided or environment token.
   * @param repo - Repository in "owner/repo" format.
   * @param localDir - Local folder to clone into.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the repository is cloned.
   * @example
   * await gitHelper.cloneRepo('owner/repo', './local-dir', { token: 'token' });
   */
  cloneRepo(repo: string, localDir: string, options?: GitOptions): Promise<void>

  /**
   * Pulls the latest changes from a given branch.
   * @param localDir - Local repository directory.
   * @param branch - Branch name to pull. Default is 'main'.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the pull is complete.
   * @example
   * await gitHelper.pullRepo('./local-dir', 'main');
   */
  pullRepo(
    localDir: string,
    branch?: string,
    options?: GitOptions
  ): Promise<void>

  /**
   * Adds changes, commits with a message, and pushes to remote.
   * @param localDir - Local repository directory.
   * @param commitMessage - The commit message.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the changes are pushed.
   * @example
   * await gitHelper.commitAndPush('./local-dir', 'Initial commit');
   */
  commitAndPush(
    localDir: string,
    commitMessage: string,
    options?: GitOptions
  ): Promise<void>

  /**
   * Creates a new branch and switches to it.
   * @param localDir - Local repository directory.
   * @param branchName - The branch to create.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the branch is created and switched to.
   * @example
   * await gitHelper.createAndCheckoutBranch('./local-dir', 'feature/new-branch');
   */
  createAndCheckoutBranch(
    localDir: string,
    branchName: string,
    options?: GitOptions
  ): Promise<void>

  /**
   * Checks out an existing branch.
   * @param localDir - Local repository directory.
   * @param branchName - The branch to checkout.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the branch is checked out.
   * @example
   * await gitHelper.checkoutBranch('./local-dir', 'main');
   */
  checkoutBranch(
    localDir: string,
    branchName: string,
    options?: GitOptions
  ): Promise<void>

  /**
   * Merges a branch into the current branch.
   * @param localDir - Local repository directory.
   * @param branchToMerge - The branch to merge.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the merge is complete.
   * @example
   * await gitHelper.mergeBranch('./local-dir', 'feature/branch-to-merge');
   */
  mergeBranch(
    localDir: string,
    branchToMerge: string,
    options?: GitOptions
  ): Promise<void>

  /**
   * Pushes a branch to the remote repository, setting upstream if needed.
   * @param localDir - Local repository directory.
   * @param branchName - The branch to push.
   * @param options - Optional credentials overrides.
   * @returns A promise that resolves when the branch is pushed.
   * @example
   * await gitHelper.pushBranch('./local-dir', 'feature/new-branch');
   */
  pushBranch(
    localDir: string,
    branchName: string,
    options?: GitOptions
  ): Promise<void>

  /**
   * Retrieves the latest commit subject.
   * @returns A promise that resolves with the latest commit subject as a string.
   * @example
   * const subject = await gitHelper.getLatestCommitSubject();
   * console.log(subject);
   */
  getLatestCommitSubject(): Promise<string>

  /**
   * Retrieves the latest commit message.
   * @returns A promise that resolves with the latest commit message.
   * @example
   * const message = await gitHelper.getLatestCommitMessage();
   * console.log(message);
   */
  getLatestCommitMessage(): Promise<string>

  /**
   * Extracts a version from a commit message.
   * @param commitMessage - The commit message to extract the version from.
   * @returns The extracted version as a string, or null if no version is found.
   * @example
   * const version = gitHelper.extractVersionFromCommit('bump version to 1.2.3.4');
   * console.log(version); // "1.2.3.4"
   */
  extractVersionFromCommit(commitMessage: string): string | null

  /**
   * Updates the Git repository with a new version.
   * @param newVersion - The new version to set.
   * @param csprojPath - The path to the .csproj file to add to the commit.
   * @param commitUser - The Git username for the commit.
   * @param commitEmail - The Git email for the commit.
   * @param commitMessagePrefix - The prefix for the commit message.
   * @returns A promise that resolves when the update is complete.
   * @example
   * await gitHelper.updateGit('1.2.3.4', 'path/to/project.csproj', 'user', 'email@example.com', 'Bump version to ');
   */
  updateGit(
    newVersion: string,
    csprojPath: string,
    commitUser: string,
    commitEmail: string,
    commitMessagePrefix: string
  ): Promise<void>

  /**
   * Pulls the latest changes from the remote repository.
   * @returns A promise that resolves when the pull is complete.
   * @example
   * await gitHelper.gitPull();
   */
  gitPull(): Promise<void>

  /**
   * Pushes the local changes to the remote repository.
   * @returns A promise that resolves when the push is complete.
   * @example
   * await gitHelper.gitPush();
   */
  gitPush(): Promise<void>

  /**
   * Restores the specified file or files to their last committed state.
   * @param paths - The file or files to restore.
   * @returns A promise that resolves when the restore is complete.
   * @example
   * await gitHelper.gitRestore(['file1.txt', 'file2.txt']);
   */
  gitRestore(paths: string | string[]): Promise<void>

  /**
   * Commits staged changes with a specified commit message.
   * @param message - The commit message to use.
   * @returns A promise that resolves when the commit is complete.
   * @example
   * await gitHelper.gitCommit('Initial commit');
   */
  gitCommit(message: string): Promise<void>

  /**
   * Checks the current status of the Git repository.
   * @returns A promise that resolves with the output of the `git status` command.
   * @example
   * const status = await gitHelper.gitStatus();
   * console.log(status);
   */
  gitStatus(): Promise<string>

  /**
   * Creates a new branch and switches to it.
   * @param branchName - The name of the new branch.
   * @returns A promise that resolves when the branch is created and switched to.
   * @example
   * await gitHelper.gitCreateAndSwitchBranch('feature/new-branch');
   */
  gitCreateAndSwitchBranch(branchName: string): Promise<void>

  /**
   * Deletes a local branch.
   * @param branchName - The name of the branch to delete.
   * @returns A promise that resolves when the branch is deleted.
   * @example
   * await gitHelper.gitDeleteBranch('feature/old-branch');
   */
  gitDeleteBranch(branchName: string): Promise<void>

  /**
   * Fetches updates from the remote repository.
   * @returns A promise that resolves when the fetch is complete.
   * @example
   * await gitHelper.gitFetch();
   */
  gitFetch(): Promise<void>

  /**
   * Merges a specified branch into the current branch.
   * @param branchName - The name of the branch to merge.
   * @returns A promise that resolves when the merge is complete.
   * @example
   * await gitHelper.gitMerge('feature/branch-to-merge');
   */
  gitMerge(branchName: string): Promise<void>

  /**
   * Resets the repository to a specific commit.
   * @param commitHash - The hash of the commit to reset to.
   * @param hard - Whether to perform a hard reset (default: false).
   * @returns A promise that resolves when the reset is complete.
   * @example
   * await gitHelper.gitReset('abc123', true);
   */
  gitReset(commitHash: string, hard?: boolean): Promise<void>
}

/**
 * Options for Git operations, including optional credentials.
 */
export interface GitOptions {
  /**
   * The GitHub token for authentication.
   */
  token?: string

  /**
   * The GitHub actor (username) for authentication.
   */
  actor?: string
}

/**
 * A helper class for performing Git operations with detailed documentation.
 */
export class GitHelper implements IGitHelper {
  /**
   * Retrieve Git credentials from options if provided or fallback to environment variables.
   * @param options - Optional credentials overrides.
   * @returns An object containing the token and actor.
   * @throws Error if credentials are not found.
   */
  private getCredentials(options?: GitOptions): {
    token: string
    actor: string
  } {
    const actor = options?.actor || process.env['GITHUB_ACTOR']
    const token = options?.token || process.env['GITHUB_TOKEN']
    if (!actor || !token) {
      throw new Error('GITHUB_ACTOR or GITHUB_TOKEN is not defined')
    }
    return { token, actor }
  }

  /**
   * Configure Git user information if not already configured.
   * @param options - Optional credentials overrides.
   */
  private async autoConfigureGit(options?: GitOptions): Promise<void> {
    const { actor } = this.getCredentials(options)
    const configuredName = await exec.getExecOutput(
      'git',
      ['config', '--global', '--get', 'user.name'],
      { silent: true }
    )
    if (!configuredName.stdout.trim()) {
      await exec.exec('git', ['config', '--global', 'user.name', actor])
      await exec.exec('git', [
        'config',
        '--global',
        'user.email',
        `${actor}@users.noreply.github.com`
      ])
      core.info(`Auto-configured git for user: ${actor}`)
    }
  }

  /**
   * Configure Git user information.
   * @param options - Optional credentials overrides.
   */
  public async configureGit(options?: GitOptions): Promise<void> {
    await this.autoConfigureGit(options)
  }

  /**
   * Clone a repository using the provided or environment token.
   * @param repo - Repository in "owner/repo" format.
   * @param localDir - Local folder to clone into.
   * @param options - Optional credentials overrides.
   */
  public async cloneRepo(
    repo: string,
    localDir: string,
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    const { token, actor } = this.getCredentials(options)
    const authRepoUrl = `https://${actor}:${token}@github.com/${repo}.git`
    core.info(`Cloning repository ${repo} into directory: ${localDir}`)
    await exec.exec('git', ['clone', authRepoUrl, localDir])
  }

  /**
   * Pull the latest changes from a given branch.
   * @param localDir - Local repository directory.
   * @param branch - Branch name to pull. Default is 'main'.
   * @param options - Optional credentials overrides.
   */
  public async pullRepo(
    localDir: string,
    branch: string = 'main',
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    core.info(`Pulling latest changes from branch ${branch}`)
    await exec.exec('git', ['-C', localDir, 'pull', 'origin', branch])
  }

  /**
   * Add changes, commit with a message, and push to remote.
   * @param localDir - Local repository directory.
   * @param commitMessage - The commit message.
   * @param options - Optional credentials overrides.
   */
  public async commitAndPush(
    localDir: string,
    commitMessage: string,
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    core.info('Adding changes')
    await exec.exec('git', ['-C', localDir, 'add', '.'])

    core.info('Committing changes')
    await exec.exec('git', ['-C', localDir, 'commit', '-m', commitMessage])

    core.info('Pushing changes to remote')
    await exec.exec('git', ['-C', localDir, 'push', 'origin', 'HEAD'])
  }

  /**
   * Create a new branch and switch to it.
   * @param localDir - Local repository directory.
   * @param branchName - The branch to create.
   * @param options - Optional credentials overrides.
   */
  public async createAndCheckoutBranch(
    localDir: string,
    branchName: string,
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    core.info(`Creating and checking out branch ${branchName}`)
    await exec.exec('git', ['-C', localDir, 'checkout', '-b', branchName])
  }

  /**
   * Checkout an existing branch.
   * @param localDir - Local repository directory.
   * @param branchName - The branch to checkout.
   * @param options - Optional credentials overrides.
   */
  public async checkoutBranch(
    localDir: string,
    branchName: string,
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    core.info(`Checking out branch ${branchName}`)
    await exec.exec('git', ['-C', localDir, 'checkout', branchName])
  }

  /**
   * Merge a branch into the current branch.
   * @param localDir - Local repository directory.
   * @param branchToMerge - The branch to merge.
   * @param options - Optional credentials overrides.
   */
  public async mergeBranch(
    localDir: string,
    branchToMerge: string,
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    core.info(`Merging branch ${branchToMerge} into the current branch`)
    await exec.exec('git', ['-C', localDir, 'merge', branchToMerge])
  }

  /**
   * Push a branch to the remote repository, setting upstream if needed.
   * @param localDir - Local repository directory.
   * @param branchName - The branch to push.
   * @param options - Optional credentials overrides.
   */
  public async pushBranch(
    localDir: string,
    branchName: string,
    options?: GitOptions
  ): Promise<void> {
    await this.autoConfigureGit(options)
    core.info(`Pushing branch ${branchName} to the remote repository`)
    await exec.exec('git', ['-C', localDir, 'push', '-u', 'origin', branchName])
  }

  /**
   * Retrieves the latest commit subject.
   * @returns {Promise<string>} The latest commit subject as a string.
   * @throws {Error} If the Git command fails.
   */
  public async getLatestCommitSubject(): Promise<string> {
    const result = await exec.getExecOutput('git', [
      'log',
      '-1',
      '--pretty=format:%s'
    ])
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to retrieve the latest commit subject: ${result.stderr}`
      )
    }
    return result.stdout.trim()
  }

  /**
   * Retrieves the latest commit message from the Git repository.
   * @returns {Promise<string>} The latest commit message.
   * @throws {Error} If the command fails or the output is empty.
   */
  public async getLatestCommitMessage(): Promise<string> {
    const { stdout } = await exec.getExecOutput('git', [
      'log',
      '-1',
      '--pretty=%B'
    ])
    return stdout.trim()
  }

  /**
   * Extracts version from a commit message in the format "bump version to x.x.x.x".
   * @param {string} commitMessage - The commit message to extract the version from.
   * @returns {string | null} The extracted version as a string, or null if no version is found.
   */
  public extractVersionFromCommit(commitMessage: string): string | null {
    const match = commitMessage.match(/bump version to (\d+\.\d+\.\d+\.\d+)/)
    return match ? match[1] : null
  }

  /**
   * Updates the Git repository with a new version.
   * @param {string} newVersion - The new version to set.
   * @param {string} csprojPath - The path to the .csproj file to add to the commit.
   * @param {string} commitUser - The Git username for the commit.
   * @param {string} commitEmail - The Git email for the commit.
   * @param {string} commitMessagePrefix - The prefix for the commit message.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  public async updateGit(
    newVersion: string,
    csprojPath: string,
    commitUser: string,
    commitEmail: string,
    commitMessagePrefix: string
  ): Promise<void> {
    await exec.exec('git', ['config', 'user.name', commitUser])
    await exec.exec('git', ['config', 'user.email', commitEmail])
    await exec.exec('git', ['add', csprojPath])
    const commitMessageFinal = `${commitMessagePrefix}${newVersion}`
    await exec.exec('git', ['commit', '-m', commitMessageFinal])
    await exec.exec('git', ['push'])
  }

  /**
   * Pulls the latest changes from the remote repository.
   * @returns {Promise<void>} A promise that resolves when the pull is complete.
   */
  public async gitPull(): Promise<void> {
    const result = await exec.getExecOutput('git', ['pull'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to pull changes: ${result.stderr}`)
    }
  }

  /**
   * Pushes the local changes to the remote repository.
   * @returns {Promise<void>} A promise that resolves when the push is complete.
   */
  public async gitPush(): Promise<void> {
    const result = await exec.getExecOutput('git', ['push'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to push changes: ${result.stderr}`)
    }
  }

  /**
   * Restores the specified file or files to their last committed state.
   * @param {string | string[]} paths - The file or files to restore.
   * @returns {Promise<void>} A promise that resolves when the restore is complete.
   */
  public async gitRestore(paths: string | string[]): Promise<void> {
    const files = Array.isArray(paths) ? paths : [paths]
    const result = await exec.getExecOutput('git', ['restore', ...files])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to restore files: ${result.stderr}`)
    }
  }

  /**
   * Commits staged changes with a specified commit message.
   * @param {string} message - The commit message to use.
   * @returns {Promise<void>} A promise that resolves when the commit is complete.
   */
  public async gitCommit(message: string): Promise<void> {
    const result = await exec.getExecOutput('git', ['commit', '-m', message])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to commit changes: ${result.stderr}`)
    }
  }

  /**
   * Checks the current status of the Git repository.
   * @returns {Promise<string>} The output of the `git status` command.
   */
  public async gitStatus(): Promise<string> {
    const result = await exec.getExecOutput('git', ['status', '--short'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to retrieve Git status: ${result.stderr}`)
    }
    return result.stdout.trim()
  }

  /**
   * Creates a new branch and switches to it.
   * @param {string} branchName - The name of the new branch.
   * @returns {Promise<void>} A promise that resolves when the branch is created and switched to.
   */
  public async gitCreateAndSwitchBranch(branchName: string): Promise<void> {
    const result = await exec.getExecOutput('git', [
      'checkout',
      '-b',
      branchName
    ])
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to create and switch to branch '${branchName}': ${result.stderr}`
      )
    }
  }

  /**
   * Deletes a local branch.
   * @param {string} branchName - The name of the branch to delete.
   * @returns {Promise<void>} A promise that resolves when the branch is deleted.
   */
  public async gitDeleteBranch(branchName: string): Promise<void> {
    const result = await exec.getExecOutput('git', ['branch', '-d', branchName])
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to delete branch '${branchName}': ${result.stderr}`
      )
    }
  }

  /**
   * Fetches updates from the remote repository.
   * @returns {Promise<void>} A promise that resolves when the fetch is complete.
   */
  public async gitFetch(): Promise<void> {
    const result = await exec.getExecOutput('git', ['fetch'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to fetch updates: ${result.stderr}`)
    }
  }

  /**
   * Merges a specified branch into the current branch.
   * @param {string} branchName - The name of the branch to merge.
   * @returns {Promise<void>} A promise that resolves when the merge is complete.
   */
  public async gitMerge(branchName: string): Promise<void> {
    const result = await exec.getExecOutput('git', ['merge', branchName])
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to merge branch '${branchName}': ${result.stderr}`
      )
    }
  }

  /**
   * Resets the repository to a specific commit.
   * @param {string} commitHash - The hash of the commit to reset to.
   * @param {boolean} hard - Whether to perform a hard reset (default: false).
   * @returns {Promise<void>} A promise that resolves when the reset is complete.
   */
  public async gitReset(
    commitHash: string,
    hard: boolean = false
  ): Promise<void> {
    const args = ['reset', hard ? '--hard' : '--soft', commitHash]
    const result = await exec.getExecOutput('git', args)
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to reset to commit '${commitHash}': ${result.stderr}`
      )
    }
  }
}
