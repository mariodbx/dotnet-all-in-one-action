import * as exec from '@actions/exec'

/**
 * Interface defining Git operations.
 */
export interface GitInterface {
  getLatestCommitSubject(): Promise<string>
  getLatestCommitMessage(): Promise<string>
  extractVersionFromCommit(commitMessage: string): string | null
  updateGit(
    newVersion: string,
    csprojPath: string,
    commitUser: string,
    commitEmail: string,
    commitMessagePrefix: string
  ): Promise<void>
  gitPull(): Promise<void>
  gitPush(): Promise<void>
  gitRestore(paths: string | string[]): Promise<void>
  gitCommit(message: string): Promise<void>
  gitStatus(): Promise<string>
  gitCreateAndSwitchBranch(branchName: string): Promise<void>
  gitDeleteBranch(branchName: string): Promise<void>
  gitFetch(): Promise<void>
  gitMerge(branchName: string): Promise<void>
  gitReset(commitHash: string, hard?: boolean): Promise<void>
}

/**
 * Class implementing Git operations.
 */
export class GitService implements GitInterface {
  /**
   * Retrieves the latest commit subject.
   */
  async getLatestCommitSubject(): Promise<string> {
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
   */
  async getLatestCommitMessage(): Promise<string> {
    const { stdout } = await exec.getExecOutput('git', [
      'log',
      '-1',
      '--pretty=%B'
    ])
    return stdout.trim()
  }

  /**
   * Extracts version from a commit message in the format "bump version to x.x.x.x".
   */
  extractVersionFromCommit(commitMessage: string): string | null {
    const match = commitMessage.match(/bump version to (\d+\.\d+\.\d+\.\d+)/)
    return match ? match[1] : null
  }

  /**
   * Updates the Git repository with a new version.
   */
  async updateGit(
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
   */
  async gitPull(): Promise<void> {
    const result = await exec.getExecOutput('git', ['pull'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to pull changes: ${result.stderr}`)
    }
  }

  /**
   * Pushes the local changes to the remote repository.
   */
  async gitPush(): Promise<void> {
    const result = await exec.getExecOutput('git', ['push'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to push changes: ${result.stderr}`)
    }
  }

  /**
   * Restores the specified file or files to their last committed state.
   */
  async gitRestore(paths: string | string[]): Promise<void> {
    const files = Array.isArray(paths) ? paths : [paths]
    const result = await exec.getExecOutput('git', ['restore', ...files])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to restore files: ${result.stderr}`)
    }
  }

  /**
   * Commits staged changes with a specified commit message.
   */
  async gitCommit(message: string): Promise<void> {
    const result = await exec.getExecOutput('git', ['commit', '-m', message])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to commit changes: ${result.stderr}`)
    }
  }

  /**
   * Checks the current status of the Git repository.
   */
  async gitStatus(): Promise<string> {
    const result = await exec.getExecOutput('git', ['status', '--short'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to retrieve Git status: ${result.stderr}`)
    }
    return result.stdout.trim()
  }

  /**
   * Creates a new branch and switches to it.
   */
  async gitCreateAndSwitchBranch(branchName: string): Promise<void> {
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
   */
  async gitDeleteBranch(branchName: string): Promise<void> {
    const result = await exec.getExecOutput('git', ['branch', '-d', branchName])
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to delete branch '${branchName}': ${result.stderr}`
      )
    }
  }

  /**
   * Fetches updates from the remote repository.
   */
  async gitFetch(): Promise<void> {
    const result = await exec.getExecOutput('git', ['fetch'])
    if (result.exitCode !== 0) {
      throw new Error(`Failed to fetch updates: ${result.stderr}`)
    }
  }

  /**
   * Merges a specified branch into the current branch.
   */
  async gitMerge(branchName: string): Promise<void> {
    const result = await exec.getExecOutput('git', ['merge', branchName])
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to merge branch '${branchName}': ${result.stderr}`
      )
    }
  }

  /**
   * Resets the repository to a specific commit.
   */
  async gitReset(commitHash: string, hard: boolean = false): Promise<void> {
    const args = ['reset', hard ? '--hard' : '--soft', commitHash]
    const result = await exec.getExecOutput('git', args)
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to reset to commit '${commitHash}': ${result.stderr}`
      )
    }
  }
}
