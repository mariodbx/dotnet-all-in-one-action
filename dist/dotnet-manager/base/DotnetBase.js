import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class DotnetBase {
    exec;
    core;
    constructor(dependencies = { exec, core }) {
        this.exec = dependencies.exec;
        this.core = dependencies.core;
    }
    async execDotnetCommand(args, cwd) {
        try {
            await this.exec.exec('dotnet', args, cwd ? { cwd } : undefined);
        }
        catch (error) {
            const errorMessage = `Dotnet command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async getExecDotnetCommandOutput(args, cwd) {
        try {
            let output = '';
            const options = {
                cwd,
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            };
            await this.exec.exec('dotnet', args, options);
            return output;
        }
        catch (error) {
            const errorMessage = `Dotnet command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
}
