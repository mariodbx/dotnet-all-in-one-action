import * as core from '@actions/core';
import { runCommand } from './command.js';
/**
 * Installs the dotnet-ef tool locally if it is not already installed.
 *
 * This function creates or overrides the tool manifest and installs the `dotnet-ef` tool locally.
 *
 * @returns {Promise<void>} A promise that resolves when the installation is complete.
 * @throws {Error} Throws an error if the installation fails.
 *
 * @example
 * // Install dotnet-ef locally
 * await installDotnetEfLocally();
 */
export async function installDotnetEfLocally() {
    core.info('Installing dotnet-ef tool locally via tool manifest...');
    const toolManifestArgs = ['new', 'tool-manifest', '--force'];
    const installEfArgs = ['tool', 'install', '--local', 'dotnet-ef'];
    try {
        // Create or override the tool manifest
        await runCommand('dotnet', toolManifestArgs, {}, true);
        core.info('Tool manifest created or updated.');
        // Install the dotnet-ef tool locally
        await runCommand('dotnet', installEfArgs, {}, true);
        core.info('dotnet-ef tool installed locally.');
    }
    catch (error) {
        core.error('Failed to install dotnet-ef tool locally.');
        throw new Error(`Error during dotnet-ef installation: ${error}`);
    }
}
