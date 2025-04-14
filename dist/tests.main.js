import * as core from '@actions/core';
import { getInputs } from './inputs.js';
import { processMigrations, getLastNonPendingMigration, rollbackMigrations } from './utils/migrations.js';
import { runTests } from './utils/test.js';
export async function run() {
    core.setOutput('startTime', new Date().toTimeString());
    core.info(`[START] GitHub Action execution started at ${new Date().toISOString()}`);
    try {
        const inputs = getInputs();
        let baselineMigration = '';
        let newMigration = '';
        // If migrations are not skipped, get the last non-pending migration (baseline) before applying new ones.
        if (!inputs.skipMigrations) {
            baselineMigration = await getLastNonPendingMigration(inputs.getExecOutput, inputs.envName, inputs.home, inputs.migrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf);
            core.info(`Baseline migration before new migrations: ${baselineMigration}`);
            // Process new migrations.
            newMigration = await processMigrations(inputs.getExecOutput, inputs.envName, inputs.home, inputs.migrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf);
            if (newMigration) {
                core.info(`New migration applied: ${newMigration}`);
            }
            else {
                core.info('No new migrations were applied.');
            }
        }
        else {
            core.info('Skipping migrations as requested.');
        }
        // Run tests if not skipped.
        if (!inputs.skipTests) {
            try {
                await runTests(inputs.getExecOutput, inputs.envName, inputs.testFolder, inputs.testOutputFolder, inputs.testFormat);
            }
            catch (testError) {
                core.error('Tests failed.');
                // Roll back to the baseline migration captured before running processMigrations.
                if (inputs.rollbackMigrationsOnTestFailed &&
                    baselineMigration &&
                    baselineMigration !== '0') {
                    core.info(`Rolling back migrations to baseline: ${baselineMigration} due to test failure...`);
                    await rollbackMigrations(inputs.getExecOutput, inputs.envName, inputs.home, inputs.migrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf, baselineMigration);
                }
                else {
                    core.info('Rollback skipped as no valid baseline migration was available.');
                }
                throw testError;
            }
        }
        else {
            core.info('Skipping tests as requested.');
        }
        core.info('GitHub Action completed successfully.');
    }
    catch (error) {
        core.error('An error occurred during execution.');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
        core.setOutput('endTime', new Date().toTimeString());
        core.info(`[END] GitHub Action execution ended at ${new Date().toISOString()}`);
    }
}
