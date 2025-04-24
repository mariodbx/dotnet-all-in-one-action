import * as core from '@actions/core';
import { Inputs } from '../utils/Inputs.js';
import { DotnetManager } from '../dotnet-manager/DotnetManager.js';
export async function runFormat() {
    try {
        const inputs = new Inputs();
        const dotnetManager = new DotnetManager(inputs.dotnetRoot);
        const formatFolder = /*inputs.formatFolder*/ '.';
        core.info(`Formatting code in folder: ${formatFolder}`);
        // Install CSharpier if necessary
        await dotnetManager.tools.csharpier.install();
        // Format the code
        await dotnetManager.tools.csharpier.format(formatFolder);
        core.info('Code formatting completed successfully.');
    }
    catch (error) {
        core.error('An error occurred during code formatting.');
        if (error instanceof Error) {
            core.error(`Error: ${error.message}`);
            core.setFailed(error.message);
        }
        else {
            core.setFailed('Unknown error occurred.');
        }
    }
}
