import * as core from '@actions/core'
import { getInputs } from './utils/inputs.js'
import {
  processMigrations,
  getLastNonPendingMigration
} from './utils/migrations.js'

export async function runMigrations(): Promise<void> {
  core.setOutput('startTime', new Date().toTimeString())
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  try {
    const inputs = getInputs()

    if (!inputs.runMigrations) {
      core.info('Skipping migrations as requested.')
      return
    }

    const baselineMigration = await getLastNonPendingMigration(
      inputs.showFullOutput,
      inputs.envName,
      inputs.homeDirectory,
      inputs.migrationsFolder,
      inputs.dotnetRoot,
      inputs.useGlobalDotnetEf
    )
    core.info(
      `Baseline migration before new migrations: ${baselineMigration || 'None'}`
    )

    const newMigration = await processMigrations(
      inputs.showFullOutput,
      inputs.envName,
      inputs.homeDirectory,
      inputs.migrationsFolder,
      inputs.dotnetRoot,
      inputs.useGlobalDotnetEf
    )
    core.info(
      newMigration
        ? `New migration applied: ${newMigration}`
        : 'No new migrations were applied.'
    )

    core.info('GitHub Action completed successfully.')
  } catch (error) {
    core.error('An error occurred during execution.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  } finally {
    core.setOutput('endTime', new Date().toTimeString())
    core.info(
      `[END] GitHub Action execution ended at ${new Date().toISOString()}`
    )
  }
}
