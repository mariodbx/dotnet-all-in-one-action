import * as core from '@actions/core'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import { Inputs } from '../utils/Inputs.js'

export async function runMigrations(): Promise<void> {
  try {
    const inputs = new Inputs()
    const dotnet = new DotnetManager()

    // Install dotnet-ef locally if the flag is set to false
    core.info('Installing dotnet-ef...')
    await dotnet.tools.ef.ensureInstalled()

    const baselineMigration = await dotnet.tools.ef.getLastNonPendingMigration(
      inputs.envName,
      process.env.HOME || 'home/node',
      inputs.migrationsFolder
    )
    core.info(
      `Baseline migration before new migrations: ${baselineMigration || 'None'}`
    )

    const newMigration = await dotnet.tools.ef.processMigrations(
      inputs.envName,
      process.env.HOME || 'home/node',
      inputs.migrationsFolder
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
