import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { DotnetBase } from '../base/DotnetBase.js';
export class MigrationService extends DotnetBase {
    constructor(dependencies = { exec, core }) {
        super(dependencies);
    }
    async processMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        try {
            this.core.info(`Processing migrations for environment: ${envName}`);
            const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`;
            const args = [
                efTool,
                'database',
                'update',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            await this.execDotnetCommand(args, home);
            this.core.info('Migrations processed successfully');
            return 'Migrations applied successfully';
        }
        catch (error) {
            const errorMessage = `Failed to process migrations for environment: ${envName}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async rollbackMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf, targetMigration) {
        try {
            this.core.info(`Rolling back to migration: ${targetMigration} for environment: ${envName}`);
            const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`;
            const args = [
                efTool,
                'database',
                'update',
                targetMigration,
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            await this.execDotnetCommand(args, home);
            this.core.info('Migration rolled back successfully');
        }
        catch (error) {
            const errorMessage = `Failed to rollback to migration: ${targetMigration} for environment: ${envName}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async getCurrentAppliedMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        try {
            if (!useGlobalDotnetEf) {
                this.core.info('Ensuring local dotnet-ef tool is installed...');
                await this.installDotnetEfLocally();
            }
            const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`;
            const args = [
                efTool,
                'migrations',
                'list',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            const migrationOutput = await this.getExecDotnetCommandOutput(args, home);
            this.core.info(`Full migration output:\n${migrationOutput}`);
            const appliedMigrations = migrationOutput
                .split('\n')
                .filter((line) => line.includes('[applied]'))
                .map((line) => line.replace(/\[applied\]/i, '').trim());
            const lastApplied = appliedMigrations.length > 0 ? appliedMigrations.pop() : '0';
            this.core.info(`Current applied migration: ${lastApplied}`);
            return lastApplied;
        }
        catch (error) {
            const errorMessage = `Failed to get current applied migration for environment: ${envName}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async getLastNonPendingMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        try {
            if (!useGlobalDotnetEf) {
                this.core.info('Ensuring local dotnet-ef tool is installed...');
                await this.installDotnetEfLocally();
            }
            const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`;
            const args = [
                efTool,
                'migrations',
                'list',
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            const migrationOutput = await this.getExecDotnetCommandOutput(args, home);
            this.core.info(`Full migration output:\n${migrationOutput}`);
            const nonPendingMigrations = migrationOutput
                .split('\n')
                .filter((line) => line.trim() && !/\(pending\)/i.test(line));
            const lastMigration = nonPendingMigrations.length > 0 ? nonPendingMigrations.pop() : '0';
            this.core.info(`Last non-pending migration: ${lastMigration}`);
            return lastMigration;
        }
        catch (error) {
            const errorMessage = `Failed to get last non-pending migration for environment: ${envName}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async addMigration(migrationName, outputDir, context) {
        const args = ['migrations', 'add', migrationName, '--output-dir', outputDir];
        if (context) {
            args.push('--context', context);
        }
        await this.execDotnetCommand(args);
    }
    async updateDatabase(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`;
        const args = [
            efTool,
            'database',
            'update',
            '--project',
            migrationsFolder,
            '--environment',
            envName
        ];
        await this.execDotnetCommand(args, home);
    }
    async listMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`;
        const args = [
            efTool,
            'migrations',
            'list',
            '--project',
            migrationsFolder,
            '--environment',
            envName
        ];
        const output = await this.getExecDotnetCommandOutput(args, home);
        return output.split('\n').filter((line) => line.trim());
    }
    async installDotnetEfLocally() {
        try {
            this.core.info('Installing dotnet-ef tool locally...');
            const args = ['tool', 'install', '--global', 'dotnet-ef'];
            await this.execDotnetCommand(args);
            this.core.info('dotnet-ef tool installed successfully');
        }
        catch (error) {
            const errorMessage = 'Failed to install dotnet-ef tool locally';
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
}
