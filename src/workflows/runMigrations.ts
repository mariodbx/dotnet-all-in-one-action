import * as core from '@actions/core'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import { Inputs } from '../Inputs.js'

export async function runMigrations(): Promise<void> {
  try {
    const inputs = new Inputs()
    const dotnetManager = new DotnetManager()

    const baselineMigration = await dotnetManager.getLastNonPendingMigration(
      inputs.envName,
      process.env.HOME || '',
      inputs.migrationsFolder,
      inputs.dotnetRoot,
      inputs.useGlobalDotnetEf
    )
    core.info(
      `Baseline migration before new migrations: ${baselineMigration || 'None'}`
    )

    const newMigration = await dotnetManager.processMigrations(
      inputs.envName,
      process.env.HOME || '',
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
  }
}
