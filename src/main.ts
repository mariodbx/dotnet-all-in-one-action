/**
 * The entrypoint for the action. This file logs all inputs and sequentially
 * executes the main logic from various modules.
 */
import { getInputs } from './utils/inputs.js'
import { runMigrations } from './workflows/runMigrations.js'
import { runTests } from './workflows/runTests.js'
import { runVersioning } from './workflows/runVersioning.js'
import { runRelease } from './workflows/runRelease.js'
import { runChangelog } from './workflows/runChangelog.js'
import { runDockerBuild } from './workflows/runDockerBuild.js'
import { runDockerPush } from './workflows/runDockerPush.js'
import { runPublish } from './workflows/runPublish.js' // Import the new publish workflow

/* istanbul ignore next */
export async function run() {
  const inputs = getInputs()

  if (inputs.runMigrations) {
    console.log('Running migrations...')
    await runMigrations()
  }
  if (inputs.runTests) {
    console.log('Running tests...')
    await runTests()
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
  if (inputs.runPublish) {
    console.log('Running publish...')
    await runPublish() // Add the publish step
  }
  if (inputs.runRelease) {
    console.log('Running release...')
    await runRelease()
  }
  if (inputs.runChangelog) {
    console.log('Running changelog ..')
    await runChangelog()
  }

  console.log('Action completed successfully.')
}
