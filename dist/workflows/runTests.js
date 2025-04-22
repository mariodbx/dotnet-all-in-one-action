import * as core from '@actions/core';
import { Inputs } from '../Inputs.js';
import { DotnetManager } from '../dotnet-manager/DotnetManager.js';
import * as path from 'path';
import { GitManager } from '../git-manager/GitManager.js';
export async function runTests() {
    let baselineMigration = '';
    let newMigration = '';
    let resultFilePath = '';
    let resultFolder = '';
    // Retrieve and validate inputs
    const inputs = new Inputs();
    const dotnetManager = new DotnetManager();
    const gitManager = new GitManager();
    try {
        // Migrations block: Get baseline and process new migrations if requested.
        if (inputs.runTestsMigrations) {
            core.debug('Attempting to run migrations...');
            try {
                baselineMigration = await dotnetManager.getLastNonPendingMigration(inputs.testsEnvName, process.env.HOME || '', inputs.testMigrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf);
                core.info(`Baseline migration before new migrations: ${baselineMigration}`);
                newMigration = await dotnetManager.processMigrations(inputs.testsEnvName, process.env.HOME || '', inputs.testMigrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf);
                if (newMigration) {
                    core.info(`New migration applied: ${newMigration}`);
                }
                else {
                    core.info('No new migrations were applied.');
                }
            }
            catch (migrationError) {
                core.error('Error during migrations:');
                if (migrationError instanceof Error) {
                    core.error(migrationError.message);
                }
                throw migrationError;
            }
        }
        else {
            core.info('Skipping migrations as requested.');
        }
        // Run tests and capture output file path and folder.
        try {
            core.debug('Starting test execution...');
            await dotnetManager.runTests(inputs.testsEnvName, inputs.testFolder, inputs.testOutputFolder, inputs.testFormat);
            core.info('Tests executed successfully.');
            resultFolder = inputs.testOutputFolder;
            resultFilePath = path.join(resultFolder, `TestResults.${inputs.testFormat}`);
            core.debug(`Determined test results file path: ${resultFilePath}`);
        }
        catch (testError) {
            core.error('Tests failed.');
            if (inputs.rollbackMigrationsOnTestFailed &&
                baselineMigration &&
                baselineMigration !== '0') {
                try {
                    core.info(`Rolling back migrations to baseline: ${baselineMigration} due to test failure...`);
                    await dotnetManager.rollbackMigration(inputs.testsEnvName, process.env.HOME || '', inputs.testMigrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf, baselineMigration);
                    core.info('Rollback completed successfully.');
                }
                catch (rollbackError) {
                    core.error('Rollback failed:');
                    if (rollbackError instanceof Error) {
                        core.error(rollbackError.message);
                    }
                    core.error('Rollback failure will not stop the workflow.');
                }
            }
            else {
                core.info('Rollback skipped as no valid baseline migration was available or flag not set.');
            }
            throw testError;
        }
    }
    catch (error) {
        core.error('An error occurred during execution:');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
        else {
            core.error('Unknown error occurred.');
            core.setFailed('Unknown error occurred.');
        }
    }
    finally {
        if (resultFilePath && resultFolder) {
            try {
                if (inputs.uploadTestsResults) {
                    core.debug('Uploading test artifact...');
                    await gitManager.uploadTestArtifact(resultFilePath, resultFolder);
                    core.info('Artifact uploaded successfully.');
                }
                else {
                    core.debug('Artifact upload skipped as per configuration.');
                }
            }
            catch (uploadError) {
                core.error('Artifact upload failed:');
                if (uploadError instanceof Error) {
                    core.error(uploadError.message);
                }
                core.error('Artifact upload failure will not stop the workflow.');
            }
        }
        else {
            core.info('Artifact upload skipped because result paths were not available.');
        }
        core.info('GitHub Action completed its final routine.');
    }
}
