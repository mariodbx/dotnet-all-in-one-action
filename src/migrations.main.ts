import * as core from '@actions/core'
import { getInputs } from './utils/inputs.js'
import {
  processMigrations,
  getLastNonPendingMigration
} from './utils/migrations.js'

export async function runMigrations(): Promise<void> {
  const startTime = new Date()
  core.setOutput('startTime', startTime.toTimeString())
  core.info(
    `[START] GitHub Action execution started at ${startTime.toISOString()}`
  )

  try {
    const inputs = getInputs()
    core.debug(`Inputs received: ${JSON.stringify(inputs)}`)

    if (!inputs.runMigrations) {
      core.info('Skipping migrations as requested.')
      return
    }

    const homeDir = process.env.HOME || ''
    const {
      showFullOutput,
      envName,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    } = inputs

    const baselineMigration = await getLastNonPendingMigration(
      showFullOutput,
      envName,
      homeDir,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
    core.info(
      `Baseline migration before new migrations: ${baselineMigration || 'None'}`
    )

    const newMigration = await processMigrations(
      showFullOutput,
      envName,
      homeDir,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
    core.info(
      newMigration
        ? `New migration applied: ${newMigration}`
        : 'No new migrations were applied.'
    )

    core.info('GitHub Action completed successfully.')
  } catch (error) {
    handleError(error)
  } finally {
    const endTime = new Date()
    core.setOutput('endTime', endTime.toTimeString())
    core.info(`[END] GitHub Action execution ended at ${endTime.toISOString()}`)
  }
}

function handleError(error: unknown): void {
  core.error('An error occurred during execution.')
  if (error instanceof Error) {
    core.error(`Error: ${error.message}`)
    core.setFailed(error.message)
  } else {
    core.setFailed('An unknown error occurred.')
  }
}
