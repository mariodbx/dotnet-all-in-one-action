import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class ProjectService {
    dotnetRoot;
    core;
    exec;
    constructor(dotnetRoot, dependencies = { core, exec }) {
        this.dotnetRoot = dotnetRoot;
        this.core = dependencies.core;
        this.exec = dependencies.exec;
    }
    async publish(configuration, outputDir, additionalFlags = []) {
        try {
            this.core.info(`Publishing .NET project with configuration: ${configuration}`);
            await this.exec.exec('dotnet', ['publish', '-c', configuration, '-o', outputDir, ...additionalFlags], {
                env: { DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('Project published successfully.');
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
            await this.exec.exec('dotnet', ['restore'], {
                env: { DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('NuGet packages restored successfully.');
        }
        catch (error) {
            const errorMessage = `Failed to restore NuGet packages: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    async build(configuration) {
        try {
            this.core.info(`Building project with configuration: ${configuration}...`);
            await this.exec.exec('dotnet', ['build', '-c', configuration], {
                env: { DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('Project built successfully.');
        }
        catch (error) {
            const errorMessage = `Failed to build project: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}
