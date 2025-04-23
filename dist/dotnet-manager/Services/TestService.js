import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class TestService {
    core;
    exec;
    constructor(dependencies = { core, exec }) {
        this.core = dependencies.core;
        this.exec = dependencies.exec;
    }
    async runTests(projectPath, testResultsPath, additionalArgs = []) {
        try {
            const args = [
                'test',
                projectPath,
                '--logger',
                `trx;LogFileName=${testResultsPath}`,
                ...additionalArgs
            ];
            await this.exec.exec('dotnet', args);
            this.core.info(`Tests executed successfully. Results saved to ${testResultsPath}`);
        }
        catch (error) {
            const message = `Failed to execute tests for project: ${projectPath}. ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
    async parseTestResults(testResultsPath) {
        try {
            // Placeholder for parsing logic. In a real implementation, you would parse the TRX file.
            this.core.info(`Parsing test results from ${testResultsPath}`);
            return `Test results parsed successfully from ${testResultsPath}`;
        }
        catch (error) {
            const message = `Failed to parse test results from: ${testResultsPath}. ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
}
