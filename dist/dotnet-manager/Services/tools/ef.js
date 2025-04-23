import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class ef {
    dotnetRoot;
    useGlobalDotnetEf;
    core;
    exec;
    constructor(dotnetRoot, useGlobalDotnetEf, dependencies = { core, exec }) {
        {
            this.core = dependencies.core;
            this.exec = dependencies.exec;
        }
        this.dotnetRoot = dotnetRoot;
        this.useGlobalDotnetEf = useGlobalDotnetEf;
    }
    getEfTool() {
        if (this.useGlobalDotnetEf) {
            return 'dotnet-ef';
        }
        return 'dotnet';
    }
    getEfCommand() {
        return this.useGlobalDotnetEf ? [] : ['ef'];
    }
    async installDotnetEf() {
        try {
            const efCommand = this.useGlobalDotnetEf
                ? 'dotnet tool install --global dotnet-ef'
                : 'dotnet tool install dotnet-ef';
            this.core.info('Installing dotnet-ef tool...');
            await this.exec.exec('dotnet', efCommand.split(' '), {
                env: { DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('dotnet-ef tool installed successfully.');
        }
        catch (error) {
            const message = `Failed to install dotnet-ef: ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
    async processMigrations(envName, home, migrationsFolder) {
        try {
            const args = [
                this.getEfTool(),
                'database',
                'update',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            await exec.exec(this.getEfTool(), args, { cwd: home });
            return 'Migrations applied successfully';
        }
        catch (error) {
            const message = `Migration failed: ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
    async rollbackMigration(envName, home, migrationsFolder, targetMigration) {
        try {
            const args = [
                this.getEfTool(),
                'database',
                'update',
                targetMigration,
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            await exec.exec(this.getEfTool(), args, { cwd: home });
            core.info('Migration rolled back successfully');
        }
        catch (error) {
            const message = `Failed to rollback to migration: ${targetMigration} for environment: ${envName}. ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
    async getCurrentAppliedMigration(envName, home, migrationsFolder) {
        try {
            const args = [
                ...this.getEfCommand(),
                'migrations',
                'list',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            let migrationOutput = '';
            await exec.exec(this.getEfTool(), args, {
                cwd: home,
                listeners: {
                    stdout: (data) => {
                        migrationOutput += data.toString();
                    }
                }
            });
            const appliedMigrations = migrationOutput
                .split('\n')
                .filter((line) => line.includes('[applied]'))
                .map((line) => line.replace(/\[applied\]/i, '').trim());
            return appliedMigrations.length > 0 ? appliedMigrations.pop() : '0';
        }
        catch (error) {
            const message = `Failed to get current applied migration for environment: ${envName}. ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
    async getLastNonPendingMigration(envName, home, migrationsFolder) {
        try {
            const args = [
                ...this.getEfCommand(),
                'migrations',
                'list',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            let migrationOutput = '';
            await exec.exec(this.getEfTool(), args, {
                cwd: home,
                listeners: {
                    stdout: (data) => {
                        migrationOutput += data.toString();
                    }
                }
            });
            const nonPendingMigrations = migrationOutput
                .split('\n')
                .filter((line) => line.trim() && !/\(pending\)/i.test(line));
            return nonPendingMigrations.length > 0 ? nonPendingMigrations.pop() : '0';
        }
        catch (error) {
            const message = `Failed to get last non-pending migration for environment: ${envName}. ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
    async addMigration(migrationName, outputDir, context) {
        try {
            const args = [
                ...this.getEfCommand(),
                'migrations',
                'add',
                migrationName,
                '--output-dir',
                outputDir
            ];
            if (context) {
                args.push('--context', context);
            }
            await exec.exec(this.getEfTool(), args);
        }
        catch (error) {
            const message = `Failed to add migration: ${migrationName}. ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
    async updateDatabase(envName, home, migrationsFolder) {
        try {
            const args = [
                this.getEfTool(),
                'database',
                'update',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            await exec.exec(this.getEfTool(), args, { cwd: home });
        }
        catch (error) {
            const message = `Failed to update database for environment: ${envName}. ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
    async listMigrations(envName, home, migrationsFolder) {
        try {
            const args = [
                ...this.getEfCommand(),
                'migrations',
                'list',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            let output = '';
            await exec.exec(this.getEfTool(), args, {
                cwd: home,
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            });
            return output.split('\n').filter((line) => line.trim());
        }
        catch (error) {
            const message = `Failed to list migrations for environment: ${envName}. ${error.message}`;
            core.error(message);
            throw new Error(message);
        }
    }
}
