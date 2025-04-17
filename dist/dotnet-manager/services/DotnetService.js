import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { DotnetBase } from '../base/DotnetBase.js';
export class DotnetService extends DotnetBase {
    constructor(dependencies = { exec, core }) {
        super(dependencies);
    }
    async installDotnetEf() {
        try {
            this.core.info('Installing dotnet-ef tool locally...');
            await this.execDotnetCommand(['new', 'tool-manifest', '--force']);
            await this.execDotnetCommand(['tool', 'install', '--local', 'dotnet-ef']);
        }
        catch (error) {
            const errorMessage = 'Failed to install dotnet-ef tool locally';
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async publishProject(configuration, outputDir, additionalFlags = []) {
        try {
            this.core.info(`Publishing .NET project with configuration: ${configuration}`);
            await this.execDotnetCommand([
                'publish',
                '-c',
                configuration,
                '-o',
                outputDir,
                ...additionalFlags
            ]);
        }
        catch (error) {
            const errorMessage = `Failed to publish .NET project with configuration: ${configuration}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async restorePackages() {
        try {
            this.core.info('Restoring NuGet packages...');
            await this.execDotnetCommand(['restore']);
            this.core.info('NuGet packages restored successfully.');
        }
        catch (error) {
            const errorMessage = `Failed to restore NuGet packages: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    async buildProject(configuration) {
        try {
            this.core.info(`Building project with configuration: ${configuration}...`);
            await this.execDotnetCommand(['build', '-c', configuration]);
            this.core.info('Project built successfully.');
        }
        catch (error) {
            const errorMessage = `Failed to build project: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}
