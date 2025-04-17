import * as exec from '@actions/exec';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { DotnetBase } from '../base/DotnetBase.js';
export class TestService extends DotnetBase {
    constructor(dependencies = { exec, core }) {
        super(dependencies);
    }
    async runTests(envName, testFolder, testOutputFolder, testFormat) {
        this.core.info(`Setting DOTNET_ENVIRONMENT to "${envName}" for test execution...`);
        if (!fs.existsSync(testFolder)) {
            throw new Error(`Test folder does not exist: ${testFolder}`);
        }
        process.env.DOTNET_ENVIRONMENT = envName;
        this.core.info(`Running tests in folder: ${testFolder}...`);
        const args = ['test', testFolder, '--verbosity', 'detailed'];
        const resolvedOutputFolder = path.resolve(testOutputFolder);
        if (testFormat) {
            const resultFileName = `TestResults.${testFormat}`;
            const resultFilePath = path.join(resolvedOutputFolder, resultFileName);
            fs.mkdirSync(resolvedOutputFolder, { recursive: true });
            args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`);
        }
        try {
            this.core.info(`Executing command: dotnet ${args.join(' ')}`);
            const stdout = await this.getExecDotnetCommandOutput(args);
            this.core.info(stdout);
            this.core.info('Tests completed successfully.');
        }
        catch (error) {
            const errorMessage = `Test execution encountered an error: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    async cleanTestResults(testOutputFolder) {
        try {
            this.core.info(`Cleaning test results in folder: ${testOutputFolder}...`);
            if (fs.existsSync(testOutputFolder)) {
                fs.rmSync(testOutputFolder, { recursive: true, force: true });
                this.core.info('Test results cleaned successfully.');
            }
            else {
                this.core.info('Test output folder does not exist. Nothing to clean.');
            }
        }
        catch (error) {
            const errorMessage = `Failed to clean test results: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}
