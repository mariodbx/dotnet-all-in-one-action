import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
export class csharpier {
    dotnetRoot;
    useGlobalCsharpier;
    core;
    exec;
    constructor(dotnetRoot, useGlobalCsharpier, dependencies = { core, exec }) {
        this.dotnetRoot = dotnetRoot;
        this.useGlobalCsharpier = useGlobalCsharpier || false;
        this.core = dependencies.core || core;
        this.exec = dependencies.exec || exec;
    }
    getCsharpierTool() {
        return this.useGlobalCsharpier ? 'csharpier' : 'dotnet';
    }
    getCsharpierCommand() {
        return this.useGlobalCsharpier ? [] : ['tool', 'run', 'csharpier'];
    }
    async install() {
        try {
            if (this.useGlobalCsharpier) {
                this.core.info('Installing CSharpier globally...');
                await this.exec.exec('dotnet', ['tool', 'install', '--global', 'csharpier'], {
                    env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
                });
                this.core.info('CSharpier installed globally.');
            }
            else {
                this.core.info('Installing CSharpier locally...');
                const toolManifestArgs = ['new', 'tool-manifest', '--force'];
                const installCsharpierArgs = ['tool', 'install', '--local', 'csharpier'];
                const writableDir = path.join(process.env.HOME || '/tmp', '.dotnet-tools');
                if (!fs.existsSync(writableDir)) {
                    fs.mkdirSync(writableDir, { recursive: true });
                }
                const updatedEnv = {
                    ...process.env,
                    DOTNET_ROOT: this.dotnetRoot,
                    PATH: `${writableDir}:${process.env.PATH}`
                };
                // Create the tool manifest
                this.core.info(`Running: dotnet ${toolManifestArgs.join(' ')}`);
                await this.exec.exec('dotnet', toolManifestArgs, {
                    cwd: writableDir,
                    env: updatedEnv
                });
                this.core.info('Tool manifest created successfully.');
                // Install CSharpier locally
                this.core.info(`Running: dotnet ${installCsharpierArgs.join(' ')}`);
                await this.exec.exec('dotnet', installCsharpierArgs, {
                    cwd: writableDir,
                    env: updatedEnv
                });
                this.core.info('CSharpier installed locally via tool manifest.');
            }
        }
        catch (error) {
            const errorMessage = `Failed to install CSharpier: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    async format(directory) {
        try {
            const csharpierCmd = this.getCsharpierTool();
            const csharpierArgs = [...this.getCsharpierCommand(), directory];
            this.core.info(`Formatting code in directory: ${directory}...`);
            await this.exec.exec(csharpierCmd, csharpierArgs, {
                env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('Code formatted successfully.');
        }
        catch (error) {
            const errorMessage = `Failed to format code in directory: ${directory}. ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}
