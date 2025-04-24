import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
export class ef {
    dotnetRoot;
    useGlobalDotnetEf;
    core;
    exec;
    constructor(dotnetRoot, useGlobalDotnetEf, dependencies = { core, exec }) {
        this.core = dependencies.core;
        this.exec = dependencies.exec;
        this.dotnetRoot = dotnetRoot;
        this.useGlobalDotnetEf = useGlobalDotnetEf;
    }
    getEfTool() {
        return this.useGlobalDotnetEf ? 'dotnet-ef' : 'dotnet';
    }
    getEfCommand() {
        return this.useGlobalDotnetEf ? [] : ['tool', 'run', 'dotnet-ef'];
    }
    async getDotnetEfPath() {
        let efPath = '';
        await this.exec.exec('which', ['dotnet-ef'], {
            listeners: {
                stdout: (data) => {
                    efPath += data.toString().trim();
                }
            }
        });
        if (!efPath) {
            throw new Error('dotnet-ef not found in PATH');
        }
        return efPath;
    }
    async installDotnetEf() {
        try {
            if (this.useGlobalDotnetEf) {
                this.core.info('Installing dotnet-ef tool globally...');
                // Install the dotnet-ef tool globally
                await this.exec.exec('dotnet', [
                    'tool',
                    'install',
                    '--global',
                    'dotnet-ef'
                ]);
                // Use `which` to find the global dotnet-ef path
                const efPath = await this.getDotnetEfPath();
                this.core.info(`Verifying dotnet-ef installation at: ${efPath}`);
                // Verify the installation
                await this.exec.exec(efPath, ['--version']);
                this.core.info('dotnet-ef tool installed and verified successfully.');
            }
            else {
                // Install locally using a tool manifest
                this.core.info('Setting up local tool manifest and installing dotnet-ef...');
                const toolManifestArgs = ['new', 'tool-manifest', '--force'];
                const installEfArgs = ['tool', 'install', '--local', 'dotnet-ef'];
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
                // Install dotnet-ef locally
                this.core.info(`Running: dotnet ${installEfArgs.join(' ')}`);
                await this.exec.exec('dotnet', installEfArgs, {
                    cwd: writableDir,
                    env: updatedEnv
                });
                this.core.info('dotnet-ef installed locally via tool manifest.');
            }
            this.core.info('dotnet-ef tool installed successfully.');
        }
        catch (error) {
            const message = `Failed to install dotnet-ef: ${error.message}`;
            this.core.error(message);
            throw new Error(message);
        }
    }
    async processMigrations(envName, home, migrationsFolder) {
        let migrationOutput = '';
        // Normalize working directory to avoid ENOTDIR
        const workDir = fs.existsSync(migrationsFolder) &&
            fs.statSync(migrationsFolder).isDirectory()
            ? migrationsFolder
            : path.dirname(migrationsFolder);
        const baseEnv = {
            ...process.env,
            DOTNET_ROOT: this.dotnetRoot,
            HOME: process.env.HOME || home,
            ASPNETCORE_ENVIRONMENT: envName
        };
        const migrationOptions = {
            cwd: workDir,
            env: baseEnv,
            listeners: {
                stdout: (data) => {
                    migrationOutput += data.toString();
                }
            }
        };
        const efCmd = this.getEfTool();
        let efArgs = [...this.getEfCommand(), 'migrations', 'list'];
        this.core.info(`Listing migrations in folder: ${workDir}...`);
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
            await this.exec.exec(this.getEfTool(), args, {
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
        let migrationOutput = '';
        // Normalize working directory
        const workDir = fs.existsSync(migrationsFolder) &&
            fs.statSync(migrationsFolder).isDirectory()
            ? migrationsFolder
            : path.dirname(migrationsFolder);
        const baseEnv = {
            ...process.env,
            DOTNET_ROOT: this.dotnetRoot,
            HOME: process.env.HOME || home,
            ASPNETCORE_ENVIRONMENT: envName
        };
        const migrationOptions = {
            cwd: workDir,
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
        let migrationOutput = '';
        // Normalize working directory
        const workDir = fs.existsSync(migrationsFolder) &&
            fs.statSync(migrationsFolder).isDirectory()
            ? migrationsFolder
            : path.dirname(migrationsFolder);
        const baseEnv = {
            ...process.env,
            DOTNET_ROOT: this.dotnetRoot,
            HOME: process.env.HOME || home,
            ASPNETCORE_ENVIRONMENT: envName
        };
        const migrationOptions = {
            cwd: workDir,
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
                cwd: home,
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
                cwd: home,
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
