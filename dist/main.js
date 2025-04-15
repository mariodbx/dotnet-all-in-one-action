/**
 * The entrypoint for the action. This file logs all inputs and sequentially
 * executes the main logic from various modules.
 */
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
    if (inputs.runMigrations) {
        console.log('Running migrations...');
        await runMigrations();
    }
    else {
        console.log('Skipping migrations as requested.');
    }
    if (inputs.runTests) {
        console.log('Running tests...');
        await runTests();
    }
    else {
        console.log('Skipping tests as requested.');
    }
    if (inputs.runVersioning) {
        console.log('Running versioning...');
        await runVersioning();
    }
    if (inputs.runPushToRegistry) {
        console.log('Running Push to Registry...');
        await runDocker();
    }
    else {
        console.log('Skipping Push to Registry as requested.');
    }
    if (inputs.runRelease) {
        console.log('Running release...');
        await runRelease();
    }
    else {
        console.log('Skipping release as requested.');
    }
    if (inputs.runChangelog) {
        console.log('Running changelog...');
        await runChangelog();
    }
    else {
        console.log('Skipping changelog as requested.');
    }
    console.log('Action completed successfully.');
}
