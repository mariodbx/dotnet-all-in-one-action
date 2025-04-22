import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
export class DotnetManager {
    dependencies;
    constructor(dependencies = { exec, core }) {
        this.dependencies = dependencies;
    }
    async execDotnetCommand(args, cwd) {
        const options = { cwd };
        await this.dependencies.exec.exec('dotnet', args, options);
    }
    async getExecDotnetCommandOutput(args, cwd) {
        let output = '';
        const options = {
            cwd,
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                }
            }
        };
        await this.dependencies.exec.exec('dotnet', args, options);
        return output;
    }
    // TestService
    async runTests(envName, testFolder, testOutputFolder, testFormat) {
        this.dependencies.core.info(`Setting DOTNET_ENVIRONMENT to "${envName}"...`);
        if (!fs.existsSync(testFolder)) {
            throw new Error(`Test folder does not exist: ${testFolder}`);
        }
        process.env.DOTNET_ENVIRONMENT = envName;
        this.dependencies.core.info(`Running tests in folder: ${testFolder}...`);
        const args = ['test', testFolder, '--verbosity', 'detailed'];
        const resolvedOutputFolder = path.resolve(testOutputFolder);
        if (testFormat) {
            const resultFileName = `TestResults.${testFormat}`;
            const resultFilePath = path.join(resolvedOutputFolder, resultFileName);
            fs.mkdirSync(resolvedOutputFolder, { recursive: true });
            args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`);
        }
        try {
            const stdout = await this.getExecDotnetCommandOutput(args);
            this.dependencies.core.info(stdout);
            this.dependencies.core.info('Tests completed successfully.');
        }
        catch (error) {
            const msg = `Test execution error: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    async cleanTestResults(testOutputFolder) {
        try {
            if (fs.existsSync(testOutputFolder)) {
                fs.rmSync(testOutputFolder, { recursive: true, force: true });
                this.dependencies.core.info('Test results cleaned.');
            }
            else {
                this.dependencies.core.info('No test results to clean.');
            }
        }
        catch (error) {
            const msg = `Clean test results failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    // MigrationService
    async processMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        try {
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
            return 'Migrations applied successfully';
        }
        catch (error) {
            const msg = `Migration failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    async rollbackMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf, targetMigration) {
        try {
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
        }
        catch (error) {
            const msg = `Rollback migration failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    async getCurrentAppliedMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        try {
            if (!useGlobalDotnetEf) {
                await this.installDotnetEf();
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
            const output = await this.getExecDotnetCommandOutput(args, home);
            const applied = output
                .split('\n')
                .filter((line) => line.includes('[applied]'))
                .map((line) => line.replace('[applied]', '').trim());
            return applied.length > 0 ? applied.pop() : '0';
        }
        catch (error) {
            const msg = `Fetch current migration failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    async getLastNonPendingMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        try {
            if (!useGlobalDotnetEf) {
                await this.installDotnetEf();
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
            const output = await this.getExecDotnetCommandOutput(args, home);
            const nonPending = output
                .split('\n')
                .filter((line) => line.trim() && !line.includes('(pending)'));
            return nonPending.length > 0 ? nonPending.pop() : '0';
        }
        catch (error) {
            const msg = `Get non-pending migration failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    async addMigration(migrationName, outputDir, context) {
        const args = [
            'ef',
            'migrations',
            'add',
            migrationName,
            '--output-dir',
            outputDir
        ];
        if (context) {
            args.push('--context', context);
        }
        await this.execDotnetCommand(['dotnet', ...args]);
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
            const args = ['tool', 'install', '--global', 'dotnet-ef'];
            await this.execDotnetCommand(args);
        }
        catch (error) {
            const msg = `Global dotnet-ef install failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
    async installDotnetEf() {
        try {
            this.dependencies.core.info('Creating or overwriting tool manifest...');
            await this.execDotnetCommand(['new', 'tool-manifest', '--force']);
            this.dependencies.core.info('Installing dotnet-ef as local tool...');
            await this.execDotnetCommand(['tool', 'install', 'dotnet-ef']);
            this.dependencies.core.info('dotnet-ef tool installed locally.');
        }
        catch (error) {
            const msg = `Local dotnet-ef install failed: ${error.message}`;
            this.dependencies.core.error(msg);
            throw new Error(msg);
        }
    }
}
