import * as core from '@actions/core';
import { Inputs } from '../utils/Inputs.js';
import { DotnetManager } from '../dotnet-manager/DotnetManager.js';
export async function runFormat() {
    try {
        const inputs = new Inputs();
        const dotnetManager = new DotnetManager(inputs.dotnetRoot, inputs.useGlobalDotnetEf);
        core.info('Installing CSharpier...');
        await dotnetManager.tools.csharpier.install();
        const formatDirectory = inputs.formatDirectory || '.';
        core.info(`Formatting code in directory: ${formatDirectory}`);
        await dotnetManager.tools.csharpier.format(formatDirectory);
        core.info('Code formatting completed successfully.');
    }
    catch (error) {
        core.error('An error occurred during code formatting.');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
    }
}
