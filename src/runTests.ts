import * as core from '@actions/core'
import { getInputs } from './utils/inputs.js'
import {
  processMigrations,
  getLastNonPendingMigration,
  rollbackMigrations
} from './utils/migrations.js'
import { tests } from './utils/test.js'
import { uploadTestArtifact } from './utils/artifact.js'
import * as path from 'path'

export async function runTests(): Promise<void> {
  try {
    const inputs = getInputs() // Ensure inputs are defined before use.
    core.debug(`Inputs received: ${JSON.stringify(inputs)}`) // Debug log for inputs

    // Run tests if not skipped.
    let baselineMigration = ''
    let newMigration = ''
    let resultFilePath = ''
    let resultFolder = ''

    try {
      // If migrations are not skipped, get the last non-pending migration (baseline) before applying new ones.
      if (inputs.runTestsMigrations) {
        core.debug('Running migrations...')
        baselineMigration = await getLastNonPendingMigration(
          inputs.testsEnvName,
          inputs.homeDirectory,
          inputs.testMigrationsFolder,
          inputs.dotnetRoot,
          inputs.useGlobalDotnetEf
        )
        core.info(
          `Baseline migration before new migrations: ${baselineMigration}`
        )

        // Process new migrations.
        newMigration = await processMigrations(
          inputs.testsEnvName,
          inputs.homeDirectory,
          inputs.testMigrationsFolder,
          inputs.dotnetRoot,
          inputs.useGlobalDotnetEf
        )
        core.info(
          newMigration
            ? `New migration applied: ${newMigration}`
            : 'No new migrations were applied.'
        )
      } else {
        core.info('Skipping migrations as requested.')
      }

      // Run tests and capture result file path and folder
      core.debug('Starting tests...')
      await tests(
        inputs.envName,
        inputs.testMigrationsFolder,
        inputs.testOutputFolder,
        inputs.testFormat,
        inputs.useGlobalDotnetEf // Pass the flag to use global or local dotnet-ef
      )
      core.info('Tests executed successfully.')
      resultFolder = inputs.testOutputFolder
      resultFilePath = path.join(
        resultFolder,
        `TestResults.${inputs.testFormat}`
      )
      core.debug(`Test results file path: ${resultFilePath}`)
    } catch (testError) {
      core.error('Tests failed.')
      // Roll back to the baseline migration captured before running processMigrations.
      if (
        inputs.rollbackMigrationsOnTestFailed &&
        baselineMigration &&
        baselineMigration !== '0'
      ) {
        core.info(
          `Rolling back migrations to baseline: ${baselineMigration} due to test failure...`
        )
        await rollbackMigrations(
          inputs.testsEnvName,
          inputs.homeDirectory,
          inputs.testMigrationsFolder,
          inputs.dotnetRoot,
          inputs.useGlobalDotnetEf,
          baselineMigration
        )
      } else {
        core.info(
          'Rollback skipped as no valid baseline migration was available.'
        )
      }
      throw testError
    } finally {
      // Upload test artifact
      if (inputs.uploadTestsResults && resultFilePath && resultFolder) {
        core.debug('Uploading test artifact...')
        await uploadTestArtifact(resultFilePath, resultFolder)
      }
    }

    core.info('Rollback completed successfully.')
  } catch (error) {
    core.error('An error occurred during execution.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
