import * as core from '@actions/core';
/**
 * Reads and parses GitHub Action inputs from the environment.
 *
 * This function uses the GitHub Actions `core.getInput` method to retrieve user-specified
 * inputs as defined in the action metadata file (`action.yml`). Default values are provided
 * if no user input is present for a specific property.
 *
 * The loaded inputs include:
 * - Execution mode for capturing output.
 * - Paths to the .NET executable and project folders.
 * - Flag to decide whether to skip migrations or tests.
 * - Test output format and folder.
 * - A flag to determine if migrations should be rolled back when tests fail.
 *
 * The function logs all input values for transparency and debugging.
 *
 * @returns An object that conforms to the ActionInputs interface.
 *
 * @example
 * ```ts
 * const inputs: ActionInputs = getInputs()
 * core.info(`Running tests in folder: ${inputs.testFolder}`)
 * ```
 */
export function getInputs() {
    // Parse boolean inputs by checking if the provided string is 'true'
    const getExecOutput = core.getInput('getExecOutput') === 'true';
    const skipMigrations = core.getInput('skipMigrations') === 'true';
    const useGlobalDotnetEf = core.getInput('useGlobalDotnetEf') === 'true';
    const skipTests = core.getInput('skipTests') === 'true';
    // Parse string inputs with defaults provided when empty
    const dotnetRoot = core.getInput('dotnetRoot') || '/usr/bin/dotnet';
    const envName = core.getInput('envName') || 'Test';
    const home = core.getInput('home') || '/home/node';
    const migrationsFolder = core.getInput('migrationsFolder') || './sample-project/sample-project.MVC';
    const testFolder = core.getInput('testFolder') || './sample-project/sample-project.Tests';
    const testFormat = core.getInput('testFormat') || 'html';
    const testOutputFolder = core.getInput('testOutputFolder') || `${testFolder}/TestResults`;
    // Process rollback configuration; defaults to true if not provided.
    const rawRollbackInput = core.getInput('rollbackMigrationsOnTestFailed') || 'true';
    const rollbackMigrationsOnTestFailed = rawRollbackInput.trim().toLowerCase() === 'true';
    // Log the raw and processed rollback input for debugging.
    core.info(`rollbackMigrationsOnTestFailed raw value: "${rawRollbackInput}"`);
    core.info(`rollbackMigrationsOnTestFailed boolean: ${rollbackMigrationsOnTestFailed}`);
    core.info(`rollbackMigrationsOnTestFailed raw value: "${core.getInput('rollbackMigrationsOnTestFailed')}"`);
    core.info(`rollbackMigrationsOnTestFailed boolean: ${rollbackMigrationsOnTestFailed}`);
    // Log a summary of all loaded inputs.
    core.info(`Loaded inputs:

  - getExecOutput: ${getExecOutput}
  - Dotnet Root: ${dotnetRoot}
  - Environment: ${envName}
  - Home: ${home}
  - Skip Migrations: ${skipMigrations}
  - Migration Folder: ${migrationsFolder}
  - Use Global dotnet-ef: ${useGlobalDotnetEf}

  - Skip Tests: ${skipTests}
  - Test Folder: ${testFolder}
  - Test Output Folder: ${testOutputFolder}
  - Test Format: ${testFormat}
  - Rollback Migrations On Test Failed: ${rollbackMigrationsOnTestFailed}
  `);
    return {
        getExecOutput,
        dotnetRoot,
        envName,
        home,
        skipMigrations,
        migrationsFolder,
        useGlobalDotnetEf,
        skipTests,
        testFolder,
        testFormat,
        testOutputFolder,
        rollbackMigrationsOnTestFailed
    };
}
/*
// Example usage:
//
// (async () => {
//   try {
//     const inputs = getInputs()
//     core.info(`Action is starting with the following inputs:`)
//     console.info(inputs)
//     // Proceed with further action logic using the provided inputs...
//   } catch (error) {
//     core.error(`Failed to load inputs: ${error}`)
//     process.exit(1)
//   }
// })()
*/
