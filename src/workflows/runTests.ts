import * as core from '@actions/core'
import { Inputs } from '../utils/Inputs.js'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import * as path from 'path'
import { GitManager } from '../git-manager/GitManager.js'

export async function runTests(): Promise<void> {
  let baselineMigration = ''
  let newMigration = ''
  let resultFilePath = ''
  let resultFolder = ''
  const inputs = new Inputs()
  const dotnetManager = new DotnetManager(
    inputs.dotnetRoot,
    inputs.useGlobalDotnetEf
  )
  const gitManager = new GitManager()

  try {
    // Handle migrations if enabled
    if (inputs.runTestsMigrations) {
      core.debug('Attempting to run migrations...')
      try {
        baselineMigration =
          await dotnetManager.tools.ef.getLastNonPendingMigration(
            inputs.testsEnvName,
            process.env.HOME || '',
            inputs.testMigrationsFolder
          )
        core.info(
          `Baseline migration before new migrations: ${baselineMigration}`
        )

        newMigration = await dotnetManager.tools.ef.processMigrations(
          inputs.testsEnvName,
          process.env.HOME || '',
          inputs.testMigrationsFolder
        )
        core.info(
          newMigration
            ? `New migration applied: ${newMigration}`
            : 'No new migrations were applied.'
        )
      } catch (migrationError) {
        core.error('Error during migrations:')
        if (migrationError instanceof Error) {
          core.error(migrationError.message)
        }
        throw migrationError
      }
    } else {
      core.info('Skipping migrations as requested.')
    }

    // Run tests
    try {
      core.debug('Starting test execution...')
      await dotnetManager.tests.runTests(
        inputs.testFolder,
        path.join(inputs.testOutputFolder, `TestResults.${inputs.testFormat}`),
        [`--logger:${inputs.testFormat}`]
      )
      core.info('Tests executed successfully.')

      resultFolder = inputs.testOutputFolder
      resultFilePath = path.join(
        resultFolder,
        `TestResults.${inputs.testFormat}`
      )
      core.debug(`Determined test results file path: ${resultFilePath}`)
    } catch (testError) {
      core.error('Tests failed.')
      if (
        inputs.rollbackMigrationsOnTestFailed &&
        baselineMigration &&
        baselineMigration !== '0'
      ) {
        try {
          core.info(
            `Rolling back migrations to baseline: ${baselineMigration} due to test failure...`
          )
          await dotnetManager.tools.ef.rollbackMigration(
            inputs.testsEnvName,
            process.env.HOME || '',
            inputs.testMigrationsFolder,
            baselineMigration
          )
          core.info('Rollback completed successfully.')
        } catch (rollbackError) {
          core.error('Rollback failed:')
          if (rollbackError instanceof Error) {
            core.error(rollbackError.message)
          }
          core.error('Rollback failure will not stop the workflow.')
        }
      } else {
        core.info(
          'Rollback skipped as no valid baseline migration was available or flag not set.'
        )
      }
      throw testError
    }
  } catch (error) {
    core.error('An error occurred during execution:')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    } else {
      core.error('Unknown error occurred.')
      core.setFailed('Unknown error occurred.')
    }
  } finally {
    if (resultFilePath && resultFolder) {
      try {
        if (inputs.uploadTestsResults) {
          core.debug('Uploading test artifact...')
          await gitManager.artifact.upload(
            'TestResults',
            [resultFilePath],
            resultFolder
          )
          core.info('Artifact uploaded successfully.')
        } else {
          core.debug('Artifact upload skipped as per configuration.')
        }
      } catch (uploadError) {
        core.error('Artifact upload failed:')
        if (uploadError instanceof Error) {
          core.error(uploadError.message)
        }
        core.error('Artifact upload failure will not stop the workflow.')
      }
    } else {
      core.info(
        'Artifact upload skipped because result paths were not available.'
      )
    }
    core.info('GitHub Action completed its final routine.')
  }
}
