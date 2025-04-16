import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as process from 'process'

/**
 * Configure the Git user information from the environment.
 */
export async function configureGit(): Promise<void> {
  const actor = process.env['GITHUB_ACTOR']
  if (!actor) {
    throw new Error('GITHUB_ACTOR is not defined')
  }
  await exec.exec('git', ['config', '--global', 'user.name', actor])
  await exec.exec('git', [
    'config',
    '--global',
    'user.email',
    `${actor}@users.noreply.github.com`
  ])
  core.info(`Configured git for user: ${actor}`)
}

/**
 * Clone the repository using the automatically provided GITHUB_TOKEN.
 * @param repo - Repository in "owner/repo" format.
 * @param localDir - Local folder to clone into.
 */
export async function cloneRepo(repo: string, localDir: string): Promise<void> {
  const actor = process.env['GITHUB_ACTOR']
  const token = process.env['GITHUB_TOKEN']
  if (!actor || !token) {
    throw new Error('GITHUB_ACTOR or GITHUB_TOKEN is not defined')
  }
  const authRepoUrl = `https://${actor}:${token}@github.com/${repo}.git`
  core.info(`Cloning repository ${repo} into directory: ${localDir}`)
  await exec.exec('git', ['clone', authRepoUrl, localDir])
}

/**
 * Pull the latest changes from a given branch.
 * @param localDir - Local repository directory.
 * @param branch - Branch name to pull. Default is 'main'.
 */
export async function pullRepo(
  localDir: string,
  branch: string = 'main'
): Promise<void> {
  core.info(`Pulling latest changes from branch ${branch}`)
  await exec.exec('git', ['-C', localDir, 'pull', 'origin', branch])
}

/**
 * Add all changes, commit them with a message, and push to remote.
 * @param localDir - Local repository directory.
 * @param commitMessage - Commit message to use.
 */
export async function commitAndPush(
  localDir: string,
  commitMessage: string
): Promise<void> {
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
 * @param branchName - Name of the branch to create.
 */
export async function createAndCheckoutBranch(
  localDir: string,
  branchName: string
): Promise<void> {
  core.info(`Creating and checking out branch ${branchName}`)
  await exec.exec('git', ['-C', localDir, 'checkout', '-b', branchName])
}

/**
 * Checkout an existing branch.
 * @param localDir - Local repository directory.
 * @param branchName - Name of the branch to checkout.
 */
export async function checkoutBranch(
  localDir: string,
  branchName: string
): Promise<void> {
  core.info(`Checking out branch ${branchName}`)
  await exec.exec('git', ['-C', localDir, 'checkout', branchName])
}

/**
 * Merge a branch into the current branch.
 * @param localDir - Local repository directory.
 * @param branchToMerge - Name of the branch to merge.
 */
export async function mergeBranch(
  localDir: string,
  branchToMerge: string
): Promise<void> {
  core.info(`Merging branch ${branchToMerge} into the current branch`)
  await exec.exec('git', ['-C', localDir, 'merge', branchToMerge])
}

/**
 * Push a new branch to the remote repository.
 * @param localDir - Local repository directory.
 * @param branchName - Branch name to push.
 */
export async function pushBranch(
  localDir: string,
  branchName: string
): Promise<void> {
  core.info(`Pushing branch ${branchName} to the remote repository`)
  await exec.exec('git', ['-C', localDir, 'push', '-u', 'origin', branchName])
}

// import * as core from '@actions/core';
// import * as fs from 'fs/promises';
// import * as process from 'process';
// import {
//   configureGit,
//   cloneRepo,
//   pullRepo,
//   commitAndPush,
//   createAndCheckoutBranch,
//   checkoutBranch,
//   mergeBranch,
//   pushBranch
// } from './helpers/git';

// async function run(): Promise<void> {
//   try {
//     const repo = process.env['GITHUB_REPOSITORY'];
//     if (!repo) {
//       throw new Error('GITHUB_REPOSITORY is not defined');
//     }

//     // Configure Git user details.
//     await configureGit();

//     // Define a temporary working directory.
//     const localDir = './temp-repo';

//     // Clone the repository.
//     await cloneRepo(repo, localDir);

//     // Create and switch to a new branch.
//     const newBranch = 'new-feature';
//     await createAndCheckoutBranch(localDir, newBranch);

//     // Simulate changes: write to a new file.
//     const filePath = `${localDir}/feature.txt`;
//     await fs.writeFile(filePath, 'This is a new feature implementation.\n');
//     core.info(`File created: ${filePath}`);

//     // Add, commit, and push changes on the new branch.
//     await commitAndPush(localDir, 'Add new feature implementation');

//     // Example: checkout main branch, pull latest changes, and merge the new branch into main.
//     await checkoutBranch(localDir, 'main');
//     await pullRepo(localDir, 'main');
//     await mergeBranch(localDir, newBranch);

//     // Optionally, push the merged main branch.
//     await exec.exec('git', ['-C', localDir, 'push', 'origin', 'main']);
//     core.info('Merged new-feature into main and pushed to remote.');

//     // Or push the new branch separately:
//     // await pushBranch(localDir, newBranch);

//     core.info('Git operations completed successfully!');
//   } catch (error) {
//     core.setFailed((error as Error).message);
//   }
// }

// run();
