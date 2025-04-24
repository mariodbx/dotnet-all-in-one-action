import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class ef {
    dotnetRoot;
    core;
    exec;
    constructor(dotnetRoot, dependencies = { core, exec }) {
        this.core = dependencies.core;
        this.exec = dependencies.exec;
        this.dotnetRoot = dotnetRoot;
    }
    getEfTool() {
        return 'dotnet';
    }
    getEfCommand() {
        return ['tool', 'run', 'dotnet-ef'];
    }
    async install() {
        try {
            this.core.info('Installing dotnet-ef locally...');
            const toolManifestArgs = ['new', 'tool-manifest', '--force'];
            const installEfArgs = ['tool', 'install', '--local', 'dotnet-ef'];
            const updatedEnv = {
                ...process.env,
                DOTNET_ROOT: this.dotnetRoot
            };
            // Create the tool manifest
            this.core.info(`Running: dotnet ${toolManifestArgs.join(' ')}`);
            await this.exec.exec('dotnet', toolManifestArgs, {
                cwd: process.cwd(), // Use the current working directory
                env: updatedEnv
            });
            this.core.info('Tool manifest created successfully.');
            // Install dotnet-ef locally
            this.core.info(`Running: dotnet ${installEfArgs.join(' ')}`);
            await this.exec.exec('dotnet', installEfArgs, {
                cwd: process.cwd(), // Use the current working directory
                env: updatedEnv
            });
            this.core.info('dotnet-ef installed locally via tool manifest.');
        }
        catch (error) {
            const errorMessage = `Failed to install dotnet-ef: ${error.message}`;
            this.core.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    async ensureInstalled() {
        try {
            const efCmd = this.getEfTool();
            const efArgs = [...this.getEfCommand(), '--version'];
            this.core.info('Checking if dotnet-ef is installed locally...');
            await this.exec.exec(efCmd, efArgs, {
                env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('dotnet-ef is already installed locally.');
        }
        catch {
            this.core.info('dotnet-ef is not installed locally. Installing...');
            await this.install();
        }
    }
    async processMigrations(envName, home, migrationsFolder) {
        await this.ensureInstalled();
        let migrationOutput = '';
        const baseEnv = {
            ...process.env,
            DOTNET_ROOT: this.dotnetRoot,
            HOME: process.env.HOME || home,
            ASPNETCORE_ENVIRONMENT: envName
        };
        const migrationOptions = {
            cwd: migrationsFolder, // Use migrationsFolder as the working directory
            env: baseEnv,
            listeners: {
                stdout: (data) => {
                    migrationOutput += data.toString();
                }
            }
        };
        const efCmd = this.getEfTool();
        let efArgs = [...this.getEfCommand(), 'migrations', 'list'];
        this.core.info(`Listing migrations in folder: ${migrationsFolder}...`);
        await this.exec.exec(efCmd, efArgs, migrationOptions);
        this.core.info(`Migration output:\n${migrationOutput}`);
        const pendingMigrations = migrationOutput
            .split(/\r?\n/)
            .filter((line) => line.trim() && !line.toLowerCase().includes('[applied]'));
        let lastMigration = '';
        if (pendingMigrations.length > 0) {
            this.core.info('Pending migrations detected. Applying migrations...');
            lastMigration = pendingMigrations[pendingMigrations.length - 1].trim();
            this.core.info(`Last pending migration: ${lastMigration}`);
            efArgs = [...this.getEfCommand(), 'database', 'update'];
            this.core.info(`Running: ${efCmd} ${efArgs.join(' ')}`);
            await this.exec.exec(efCmd, efArgs, migrationOptions);
            this.core.info('Migrations applied successfully.');
        }
        else {
            this.core.info('No pending migrations detected.');
        }
        return lastMigration;
    }
    async rollbackMigration(envName, home, migrationsFolder, targetMigration) {
        await this.ensureInstalled();
        try {
            const efCmd = this.getEfTool();
            const efArgs = [
                ...this.getEfCommand(),
                'database',
                'update',
                targetMigration,
                '--project',
                migrationsFolder,
                '--environment',
                envName
            ];
            await this.exec.exec(efCmd, efArgs, {
                cwd: migrationsFolder, // Use migrationsFolder as the working directory
                env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
            });
            this.core.info('Migration rolled back successfully');
        }
        catch (error) {
            const message = `Failed to rollback to migration: ${targetMigration} for environment: ${envName}. ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
    async getCurrentAppliedMigration(envName, home, migrationsFolder) {
        await this.ensureInstalled();
        let migrationOutput = '';
        const baseEnv = {
            ...process.env,
            DOTNET_ROOT: this.dotnetRoot,
            HOME: process.env.HOME || home,
            ASPNETCORE_ENVIRONMENT: envName
        };
        const migrationOptions = {
            cwd: migrationsFolder, // Use migrationsFolder as the working directory
            env: baseEnv,
            listeners: {
                stdout: (data) => {
                    migrationOutput += data.toString();
                }
            }
        };
        const efCmd = this.getEfTool();
        const efArgs = [...this.getEfCommand(), 'migrations', 'list'];
        await this.exec.exec(efCmd, efArgs, migrationOptions);
        this.core.info(`Full migration output:\n${migrationOutput}`);
        const appliedMigrations = migrationOutput
            .split(/\r?\n/)
            .filter((line) => line.toLowerCase().includes('[applied]'))
            .map((line) => line.replace(/\[applied\]/i, '').trim());
        const lastApplied = appliedMigrations.length > 0
            ? appliedMigrations[appliedMigrations.length - 1]
            : '0';
        this.core.info(`Current applied migration (baseline): ${lastApplied}`);
        return lastApplied;
    }
    async getLastNonPendingMigration(envName, home, migrationsFolder) {
        await this.ensureInstalled();
        let migrationOutput = '';
        const baseEnv = {
            ...process.env,
            DOTNET_ROOT: this.dotnetRoot,
            HOME: process.env.HOME || home,
            ASPNETCORE_ENVIRONMENT: envName
        };
        const migrationOptions = {
            cwd: migrationsFolder, // Use migrationsFolder as the working directory
            env: baseEnv,
            listeners: {
                stdout: (data) => {
                    migrationOutput += data.toString();
                }
            }
        };
        const efCmd = this.getEfTool();
        const efArgs = [...this.getEfCommand(), 'migrations', 'list'];
        await this.exec.exec(efCmd, efArgs, migrationOptions);
        this.core.info(`Full migration output:\n${migrationOutput}`);
        const migrationLines = migrationOutput
            .split(/\r?\n/)
            .map((line) => line.trim());
        const nonPendingMigrations = migrationLines.filter((line) => line !== '' && !/\(pending\)/i.test(line));
        const lastMigration = nonPendingMigrations.length > 0
            ? nonPendingMigrations[nonPendingMigrations.length - 1]
            : '0';
        this.core.info(`Last non-pending migration: ${lastMigration}`);
        return lastMigration;
    }
    async addMigration(migrationName, outputDir, context) {
        await this.ensureInstalled();
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
            await this.exec.exec(this.getEfTool(), args, {
                cwd: outputDir, // Use outputDir as the working directory
                env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
            });
        }
        catch (error) {
            const message = `Failed to add migration: ${migrationName}. ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
    async updateDatabase(envName, home, migrationsFolder) {
        await this.ensureInstalled();
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
            await this.exec.exec(this.getEfTool(), args, {
                cwd: migrationsFolder, // Use migrationsFolder as the working directory
                env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
            });
        }
        catch (error) {
            const message = `Failed to update database for environment: ${envName}. ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
    async listMigrations(envName, home, migrationsFolder) {
        await this.ensureInstalled();
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
            await this.exec.exec(this.getEfTool(), args, {
                cwd: migrationsFolder, // Use migrationsFolder as the working directory
                env: { ...process.env, DOTNET_ROOT: this.dotnetRoot },
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    }
                }
            });
            return output.split(/\r?\n/).filter((line) => line.trim());
        }
        catch (error) {
            const message = `Failed to list migrations for environment: ${envName}. ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
}
