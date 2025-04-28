/**
 * The entrypoint for the action. This file logs all inputs and sequentially
 * executes the main logic from various modules.
 */
import { runMigrations } from './workflows/runMigrations.js'
import { runTests } from './workflows/runTests.js'
import { runVersioning } from './workflows/runVersioning.js'
import { runRelease } from './workflows/runRelease.js'
import { runDockerBuild } from './workflows/runDockerBuild.js'
import { runDockerPush } from './workflows/runDockerPush.js'
import { runFormat } from './workflows/runFormat.js'
// import { runPublish } from './workflows/runPublish.js' // Import the new publish workflow
import { runHuskySetup } from './workflows/runHuskySetup.js'
import { Inputs } from './utils/Inputs.js'
// import { GitManager } from './git-manager/GitManager.js' // Import GitManager

/* istanbul ignore next */
export async function run() {
  const inputs = new Inputs()
  // const git = new GitManager()

  // // const pullRepo = true
  // // if (pullRepo) {
  // //   await git.repo.clone('.')
  // //   console.log(
  // //     `Cloned repository ${process.env.GITHUB_REPOSITORY} to ${process.env.GITHUB_WORKSPACE}`
  // //   )
  // //   await git.repo.fetch('.')
  // //   console.log('Fetched all branches and tags.')
  // //   await git.repo.checkout('.', process.env.GITHUB_REF_NAME || '')
  // //   console.log(`Checked out branch/tag ${process.env.GITHUB_REF_NAME}`)
  // //   await git.repo.pull('.', process.env.GITHUB_REF_NAME || '')
  // //   console.log(
  // //     `Pulled latest changes from branch/tag ${process.env.GITHUB_REF_NAME}`
  // //   )
  // // }

  // // Fetch the commit message using GitManager
  // const commitMessage = await git.getLatestCommitMessage()

  // // Use a regex to match "major", "minor", or "patch" in a case-insensitive manner
  // const shouldRunAll = /\b(major|minor|patch)\b/i.test(commitMessage)

  if (!inputs.runMigrations) {
    console.log('Running migrations...')
    await runMigrations()
  }
  if (inputs.runTests) {
    console.log('Running tests...')
    await runTests()
  }
  if (inputs.runFormat) {
    console.log('Running code formatting...')
    await runFormat()
  }
  if (inputs.runHuskySetup) {
    console.log('Setting up Husky...')
    await runHuskySetup()
  }
  const shouldRunAll = false
  if (!shouldRunAll) {
    console.log(
      'Skipping remaining steps as commit message does not contain "major", "minor", or "patch".'
    )
    return
  }

  if (inputs.runVersioning) {
    console.log('Running versioning...')
    await runVersioning()
  }
  if (inputs.runDockerBuild) {
    console.log('Running Docker build...')
    await runDockerBuild()
  }
  if (inputs.runDockerPush) {
    console.log('Running Docker push...')
    await runDockerPush()
  }
  // if (inputs.runPublish) {
  //   console.log('Running publish...')
  //   await runPublish()
  // }
  if (inputs.runRelease) {
    console.log('Running release...')
    await runRelease()
  }

  console.log('Action completed successfully.')
}
