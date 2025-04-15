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
  core.setOutput('startTime', new Date().toTimeString())
  core.info(
    `[START] GitHub Action execution started at ${new Date().toISOString()}`
  )

  try {
    const inputs = getInputs() // Ensure inputs are defined before use.
    // Run tests if not skipped.
    if (inputs.runTests) {
      let baselineMigration = ''
      let newMigration = ''
      let resultFilePath = ''
      let resultFolder = ''

      try {
        // If migrations are not skipped, get the last non-pending migration (baseline) before applying new ones.
        if (inputs.runTestsMigrations) {
          baselineMigration = await getLastNonPendingMigration(
            inputs.showFullOutput,
            inputs.testsEnvName,
            inputs.homeDirectory,
            inputs.migrationsFolder,
            inputs.dotnetRoot,
            inputs.useGlobalDotnetEf
          )
          core.info(
            `Baseline migration before new migrations: ${baselineMigration}`
          )

          // Process new migrations.
          newMigration = await processMigrations(
            inputs.showFullOutput,
            inputs.testsEnvName,
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
        } else {
          core.info('Skipping migrations as requested.')
        }

        // Run tests and capture result file path and folder
        await tests(
          inputs.showFullOutput,
          inputs.envName,
          inputs.testFolder,
          inputs.testOutputFolder,
          inputs.testFormat,
          inputs.useGlobalDotnetEf // Pass the flag to use global or local dotnet-ef
        )
        resultFolder = inputs.testOutputFolder
        resultFilePath = path.join(
          resultFolder,
          `TestResults.${inputs.testFormat}`
        )
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
            inputs.showFullOutput,
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
          await uploadTestArtifact(resultFilePath, resultFolder)
        }
      }
    } else {
      core.info('Skipping tests as requested.')
    }

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
