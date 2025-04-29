/**
 * The entrypoint for the action. This file logs all inputs and sequentially
 * executes the main logic from various modules.
 */
import { runMigrations } from './workflows/runMigrations.js';
import { runTests } from './workflows/runTests.js';
import { runVersioning } from './workflows/runVersioning.js';
import { runRelease } from './workflows/runRelease.js';
import { runDockerBuild } from './workflows/runDockerBuild.js';
import { runDockerPush } from './workflows/runDockerPush.js';
import { runFormat } from './workflows/runFormat.js';
import { runPublish } from './workflows/runPublish.js'; // Import the new publish workflow
import { runHuskySetup } from './workflows/runHuskySetup.js';
import { Inputs } from './utils/Inputs.js';
/* istanbul ignore next */
export async function run() {
    const inputs = new Inputs();
    if (inputs.runHuskySetup) {
        console.log('Setting up Husky...');
        await runHuskySetup();
    }
    // const git = new GitManager()
    // if (inputs.runTests) {
    console.log('Running tests...');
    await runTests();
    // }
    // if (inputs.runFormat) {
    console.log('Running code formatting...');
    await runFormat();
    // }
    // if (inputs.runVersioning) {
    console.log('Running versioning...');
    await runVersioning();
    // } else {
    //   return
    // }
    // if (inputs.runDockerBuild) {
    console.log('Running Docker build...');
    await runDockerBuild();
    // }
    // if (inputs.runDockerPush) {
    console.log('Running Docker push...');
    await runDockerPush();
    // }
    // if (inputs.runPublish) {
    console.log('Running publish...');
    await runPublish();
    // }
    // if (inputs.runRelease) {
    console.log('Running release...');
    await runRelease();
    // }
    // if (inputs.runMigrations) {
    console.log('Running migrations...');
    await runMigrations();
    // }
    console.log('Action completed successfully.');
}
