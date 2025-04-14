/**
 * The entrypoint for the action. This file logs all inputs and sequentially
 * executes the main logic from various modules.
 */
import * as core from '@actions/core';
import { getInputs } from './utils/inputs.js';
import { runMigrations } from './runMigrations.js';
import { runTests } from './runTests.js';
import { runVersioning } from './runVersioning.js';
import { runDocker } from './runDocker.js';
import { runReleaseChangelog } from './runReleaseChangelog.js';
/* istanbul ignore next */
export async function run() {
    const inputs = getInputs();
    // Log a summary of all loaded inputs.
    core.info(`Loaded inputs:

  - Show Full Output: ${inputs.showFullOutput}
  - Run Migrations: ${inputs.runMigrations}
  - Migrations Folder: ${inputs.migrationsFolder}
  - Environment Name: ${inputs.envName}
  - Dotnet Root: ${inputs.dotnetRoot}
  - Use Global dotnet-ef: ${inputs.useGlobalDotnetEf}

  - Run Tests: ${inputs.runTests}
  - Test Folder: ${inputs.testFolder}
  - Test Output Folder: ${inputs.testOutputFolder}
  - Test Format: ${inputs.testFormat}
  - Rollback Migrations On Test Failed: ${inputs.rollbackMigrationsOnTestFailed}

  - Run Versioning: ${inputs.runVersioning}
  - Current Version: ${inputs.currentVersion}
  - New Version: ${inputs.newVersion}
  - Bump Type: ${inputs.bumpType}

  - Run Push To Registry: ${inputs.runPushToRegistry}
  - Dockerfiles: ${inputs.dockerfiles}
  - Dockerfile Images: ${inputs.dockerfileImages}
  - Dockerfile Contexts: ${inputs.dockerfileContexts}
  - Registry Type: ${inputs.registryType}

  - Run Release And Changelog: ${inputs.runReleaseAndChangelog}
  - Commit User: ${inputs.commitUser}
  - Commit Email: ${inputs.commitEmail}
  - Commit Message Prefix: ${inputs.commitMessagePrefix}
  `);
    console.log('Running migrations...');
    await runMigrations();
    core.info(`Migrations step inputs:

  - Run Migrations: ${inputs.runMigrations}
  - Migrations Folder: ${inputs.migrationsFolder}
  - Environment Name: ${inputs.envName}
  - Dotnet Root: ${inputs.dotnetRoot}
  - Use Global dotnet-ef: ${inputs.useGlobalDotnetEf}
  `);
    console.log('Running tests...');
    await runTests();
    core.info(`Tests step inputs:

  - Run Tests: ${inputs.runTests}
  - Test Folder: ${inputs.testFolder}
  - Test Output Folder: ${inputs.testOutputFolder}
  - Test Format: ${inputs.testFormat}
  - Rollback Migrations On Test Failed: ${inputs.rollbackMigrationsOnTestFailed}
  `);
    console.log('Running versioning...');
    await runVersioning();
    core.info(`Versioning step inputs:

  - Run Versioning: ${inputs.runVersioning}
  - Current Version: ${inputs.currentVersion}
  - New Version: ${inputs.newVersion}
  - Bump Type: ${inputs.bumpType}
  `);
    console.log('Running Docker tasks...');
    await runDocker();
    core.info(`Docker step inputs:

  - Run Push To Registry: ${inputs.runPushToRegistry}
  - Dockerfiles: ${inputs.dockerfiles}
  - Dockerfile Images: ${inputs.dockerfileImages}
  - Dockerfile Contexts: ${inputs.dockerfileContexts}
  - Registry Type: ${inputs.registryType}
  `);
    console.log('Running release changelog...');
    await runReleaseChangelog();
    core.info(`Release and Changelog step inputs:

  - Run Release And Changelog: ${inputs.runReleaseAndChangelog}
  - Commit User: ${inputs.commitUser}
  - Commit Email: ${inputs.commitEmail}
  - Commit Message Prefix: ${inputs.commitMessagePrefix}
  `);
    console.log('Action completed successfully.');
}
