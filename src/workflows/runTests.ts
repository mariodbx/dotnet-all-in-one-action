import * as core from '@actions/core'
// import * as fs from 'fs'
// import * as path from 'path'
import { Inputs } from '../utils/Inputs.js'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import { GitManager } from '../git-manager/GitManager.js'

export async function runTests(): Promise<void> {
  const inputs = new Inputs()
  const dotnetManager = new DotnetManager()
  const gitManager = new GitManager()

  // Decide on a single “results” folder + filename
  const resultsDir = 'TestResults' // e.g. "TestResults"
  const resultFileName = `TestResults.${inputs.testFormat}` // e.g. "TestResults.trx"
  const resultFilePath = inputs.testOutputFolder + '.' + inputs.testFormat //path.join(resultsDir, resultFileName)

  let baselineMigration = ''
  let newMigration = ''

  try {
    // === 1) EF Migrations (unchanged) ===
    if (inputs.runTestsMigrations) {
      core.debug('Running EF migrations before tests…')
      baselineMigration =
        await dotnetManager.tools.ef.getLastNonPendingMigration(
          inputs.testsEnvName,
          process.env.HOME || '',
          inputs.testMigrationsFolder
        )
      core.info(`Baseline migration: ${baselineMigration}`)

      newMigration = await dotnetManager.tools.ef.processMigrations(
        inputs.testsEnvName,
        process.env.HOME || '',
        inputs.testMigrationsFolder
      )
      core.info(
        newMigration
          ? `Applied new migration: ${newMigration}`
          : 'No new migrations to apply.'
      )
    } else {
      core.info('Skipping migrations.')
    }

    // // === 2) Prepare output folder (only once) ===
    // if (!fs.existsSync(resultsDir)) {
    //   core.debug(`Creating output folder: ${resultsDir}`)
    //   await fs.promises.mkdir(resultsDir, { recursive: true })
    // }

    // === 3) Run `dotnet test` with explicit logger + results-directory ===
    try {
      core.debug('Executing dotnet test…')
      await dotnetManager.tests.runTests()
      core.info('Tests completed successfully.')
    } catch (testErr) {
      core.error('Tests failed.')

      // Rollback if configured...
      if (
        inputs.rollbackMigrationsOnTestFailed &&
        baselineMigration &&
        baselineMigration !== '0'
      ) {
        core.info(`Rolling back to ${baselineMigration}…`)
        try {
          await dotnetManager.tools.ef.rollbackMigration(
            inputs.testsEnvName,
            process.env.HOME || '',
            inputs.testMigrationsFolder,
            baselineMigration
          )
          core.info('Rollback succeeded.')
        } catch (rbErr) {
          core.error('Rollback failed:')
          core.error(rbErr instanceof Error ? rbErr.message : String(rbErr))
        }
      } else {
        core.info('Rollback not requested or no valid baseline.')
      }

      throw testErr
    }
  } catch (err) {
    // Global error handler
    core.error('runTests encountered an error:')
    const msg = err instanceof Error ? err.message : String(err)
    core.error(msg)
    core.setFailed(msg)
  } finally {
    // === 4) Upload the single .trx artifact ===
    if (inputs.uploadTestsResults) {
      try {
        core.debug('Uploading test results artifact…')
        await gitManager.artifact.upload(
          'TestResults',
          [resultFileName],
          resultsDir
        )
        core.info(`Uploaded ${resultFilePath}`)
      } catch (upErr) {
        core.error('Artifact upload failed:')
        core.error(upErr instanceof Error ? upErr.message : String(upErr))
        core.error('Continuing without failing workflow.')
      }
    } else {
      core.debug('Artifact upload disabled.')
    }

    core.info('runTests() completed.')
  }
}
