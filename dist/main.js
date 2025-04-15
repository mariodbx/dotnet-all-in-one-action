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
import { runRelease } from './runRelease.js';
import { runChangelog } from './runChangelog.js';
/* istanbul ignore next */
export async function run() {
    const inputs = getInputs();
    // Log a summary of all loaded inputs and outputs.
    core.info(`Loaded inputs:

  // General
  - Show Full Output: ${inputs.showFullOutput}
  - Home Directory: ${inputs.homeDirectory}
  - Dotnet Root: ${inputs.dotnetRoot}
  - Use Global dotnet-ef: ${inputs.useGlobalDotnetEf}

  // Migrations
  - Run Migrations: ${inputs.runMigrations}
  - Migrations Folder: ${inputs.migrationsFolder}
  - Environment Name: ${inputs.envName}
  - On Failed Rollback Migrations: ${inputs.onFailedRollbackMigrations}

  // Tests
  - Run Tests: ${inputs.runTests}
  - Run Tests Migrations: ${inputs.runTestsMigrations}
  - Test Migrations Folder: ${inputs.testMigrationsFolder}
  - Test Folder: ${inputs.testFolder}
  - Test Output Folder: ${inputs.testOutputFolder}
  - Upload Tests Results: ${inputs.uploadTestsResults}
  - Test Format: ${inputs.testFormat}
  - Rollback Migrations On Test Failed: ${inputs.rollbackMigrationsOnTestFailed}

  // Versioning
  - Run Versioning: ${inputs.runVersioning}
  - CSProj Depth: ${inputs.csprojDepth}
  - CSProj Name: ${inputs.csprojName}
  - Use Commit Message: ${inputs.useCommitMessage}
  - Commit User: ${inputs.commitUser}
  - Commit Email: ${inputs.commitEmail}
  - Commit Message Prefix: ${inputs.commitMessagePrefix}

  // Docker
  - Run Push To Registry: ${inputs.runPushToRegistry}
  - Docker Compose Files: ${inputs.dockerComposeFiles}
  - Images: ${inputs.images}
  - Dockerfiles: ${inputs.dockerfiles}
  - Dockerfile Images: ${inputs.dockerfileImages}
  - Dockerfile Contexts: ${inputs.dockerfileContexts}
  - Registry Type: ${inputs.registryType}
  - Push With Version: ${inputs.pushWithVersion}
  - Push With Latest: ${inputs.pushWithLatest}

  // Release and Changelog
  - Major Keywords: ${inputs.majorKeywords}
  - Minor Keywords: ${inputs.minorKeywords}
  - Patch Keywords: ${inputs.patchKeywords}
  - Hotfix Keywords: ${inputs.hotfixKeywords}
  - Added Keywords: ${inputs.addedKeywords}
  - Dev Keywords: ${inputs.devKeywords}

  `);
    // core.info(`Loaded outputs:
    // - Last Migration: ${outputs.lastMigration}
    // - Start Time: ${outputs.startTime}
    // - End Time: ${outputs.endTime}
    // - Version: ${outputs.version}
    // - Current Version: ${outputs.currentVersion}
    // - New Version: ${outputs.newVersion}
    // - Bump Type: ${outputs.bumpType}
    // - Skip Release: ${outputs.skipRelease}
    // - Docker Push Status: ${outputs.dockerPushStatus}
    // - Changelog: ${outputs.changelog}
    // - Release Status: ${outputs.releaseStatus}
    // - Skip: ${outputs.skip}
    // `)
    console.log('Running migrations...');
    core.info(`Migrations step inputs:

  - Run Migrations: ${inputs.runMigrations}
  - Migrations Folder: ${inputs.migrationsFolder}
  - Environment Name: ${inputs.envName}
  - Dotnet Root: ${inputs.dotnetRoot}
  - Use Global dotnet-ef: ${inputs.useGlobalDotnetEf}
  `);
    await runMigrations();
    // core.info(`Migrations step outputs:
    // - Last Migration: ${outputs.lastMigration}
    // `)
    console.log('Running tests...');
    core.info(`Tests step inputs:

  - Run Tests: ${inputs.runTests}
  - Test Folder: ${inputs.testFolder}
  - Test Output Folder: ${inputs.testOutputFolder}
  - Test Format: ${inputs.testFormat}
  - Rollback Migrations On Test Failed: ${inputs.rollbackMigrationsOnTestFailed}
  `);
    await runTests();
    // core.info(`Tests step outputs:
    // - Test Results Uploaded: ${outputs.testResultsUploaded}
    // - Test Output Folder: ${outputs.testOutputFolder}
    // - Start Time: ${outputs.startTime}
    // - End Time: ${outputs.endTime}
    // `)
    console.log('Running versioning...');
    core.info(`Versioning step inputs:

  - Run Versioning: ${inputs.runVersioning}
  `);
    await runVersioning();
    // core.info(`Versioning step outputs:
    // - Version: ${outputs.version}
    // - Current Version: ${outputs.currentVersion}
    // - New Version: ${outputs.newVersion}
    // - Bump Type: ${outputs.bumpType}
    // `)
    console.log('Running Docker tasks...');
    core.info(`Docker step inputs:

  - Run Push To Registry: ${inputs.runPushToRegistry}
  - Dockerfiles: ${inputs.dockerfiles}
  - Dockerfile Images: ${inputs.dockerfileImages}
  - Dockerfile Contexts: ${inputs.dockerfileContexts}
  - Registry Type: ${inputs.registryType}
  `);
    await runDocker();
    // core.info(`Docker step outputs:
    // - Docker Push Status: ${outputs.dockerPushStatus}
    // `)
    if (inputs.runRelease) {
        console.log('Running release...');
        core.info(`Release step inputs:
    - Run Release: ${inputs.runRelease}
    `);
        await runRelease();
        // core.info(`Release step outputs:
        // - Release Status: ${outputs.releaseStatus}
        // `)
    }
    if (inputs.runChangelog) {
        console.log('Running changelog...');
        core.info(`Changelog step inputs:
    - Run Changelog: ${inputs.runChangelog}
    `);
        await runChangelog();
        // core.info(`Changelog step outputs:
        // - Changelog: ${outputs.changelog}
        // `)
    }
    console.log('Action completed successfully.');
}
