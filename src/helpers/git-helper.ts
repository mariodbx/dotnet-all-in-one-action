import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as process from 'process'

export interface GitOptions {
  token?: string
  actor?: string
}

/**
 * Retrieve Git credentials from options if provided or fallback to environment.
 */
function getCredentials(options?: GitOptions): {
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
async function autoConfigureGit(options?: GitOptions): Promise<void> {
  const { actor } = getCredentials(options)
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
export async function configureGit(options?: GitOptions): Promise<void> {
  await autoConfigureGit(options)
}

/**
 * Clone a repository using the provided or environment token.
 * @param repo - Repository in "owner/repo" format.
 * @param localDir - Local folder to clone into.
 * @param options - Optional credentials overrides.
 */
export async function cloneRepo(
  repo: string,
  localDir: string,
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
  const { token, actor } = getCredentials(options)
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
export async function pullRepo(
  localDir: string,
  branch: string = 'main',
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
  core.info(`Pulling latest changes from branch ${branch}`)
  await exec.exec('git', ['-C', localDir, 'pull', 'origin', branch])
}

/**
 * Add changes, commit with a message, and push to remote.
 * @param localDir - Local repository directory.
 * @param commitMessage - The commit message.
 * @param options - Optional credentials overrides.
 */
export async function commitAndPush(
  localDir: string,
  commitMessage: string,
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
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
export async function createAndCheckoutBranch(
  localDir: string,
  branchName: string,
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
  core.info(`Creating and checking out branch ${branchName}`)
  await exec.exec('git', ['-C', localDir, 'checkout', '-b', branchName])
}

/**
 * Checkout an existing branch.
 * @param localDir - Local repository directory.
 * @param branchName - The branch to checkout.
 * @param options - Optional credentials overrides.
 */
export async function checkoutBranch(
  localDir: string,
  branchName: string,
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
  core.info(`Checking out branch ${branchName}`)
  await exec.exec('git', ['-C', localDir, 'checkout', branchName])
}

/**
 * Merge a branch into the current branch.
 * @param localDir - Local repository directory.
 * @param branchToMerge - The branch to merge.
 * @param options - Optional credentials overrides.
 */
export async function mergeBranch(
  localDir: string,
  branchToMerge: string,
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
  core.info(`Merging branch ${branchToMerge} into the current branch`)
  await exec.exec('git', ['-C', localDir, 'merge', branchToMerge])
}

/**
 * Push a branch to the remote repository, setting upstream if needed.
 * @param localDir - Local repository directory.
 * @param branchName - The branch to push.
 * @param options - Optional credentials overrides.
 */
export async function pushBranch(
  localDir: string,
  branchName: string,
  options?: GitOptions
): Promise<void> {
  await autoConfigureGit(options)
  core.info(`Pushing branch ${branchName} to the remote repository`)
  await exec.exec('git', ['-C', localDir, 'push', '-u', 'origin', branchName])
}
