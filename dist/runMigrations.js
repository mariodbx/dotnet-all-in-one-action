import * as core from '@actions/core';
import { getInputs } from './utils/inputs.js';
import { processMigrations, getLastNonPendingMigration } from './utils/migrations.js';
export async function runMigrations() {
    try {
        const inputs = getInputs();
        const baselineMigration = await getLastNonPendingMigration(inputs.envName, inputs.homeDirectory, inputs.migrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf);
        core.info(`Baseline migration before new migrations: ${baselineMigration || 'None'}`);
        const newMigration = await processMigrations(inputs.envName, inputs.homeDirectory, inputs.migrationsFolder, inputs.dotnetRoot, inputs.useGlobalDotnetEf);
        core.info(newMigration
            ? `New migration applied: ${newMigration}`
            : 'No new migrations were applied.');
        core.info('GitHub Action completed successfully.');
    }
    catch (error) {
        core.error('An error occurred during execution.');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
    }
}
