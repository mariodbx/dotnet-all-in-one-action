import * as core from '@actions/core';
import { TestService } from './services/TestService.js';
import { MigrationService } from './services/MigrationService.js';
import { CsprojService } from './services/CsprojService.js';
import { DotnetService } from './services/DotnetService.js';
export class DotnetManager {
    dotnetService;
    csprojService;
    migrationService;
    testService;
    constructor(dotnetService = new DotnetService(), csprojService = new CsprojService(), migrationService = new MigrationService(), testService = new TestService()) {
        this.dotnetService = dotnetService;
        this.csprojService = csprojService;
        this.migrationService = migrationService;
        this.testService = testService;
    }
    async installDotnetEf() {
        core.info('Installing dotnet-ef tool...');
        await this.dotnetService.installDotnetEf();
    }
    async publishProject(configuration, outputDir, additionalFlags = []) {
        core.info('Publishing .NET project...');
        await this.dotnetService.publishProject(configuration, outputDir, additionalFlags);
    }
    async findCsproj(csprojDepth, csprojName) {
        core.info(`Searching for .csproj file: ${csprojName} within depth ${csprojDepth}...`);
        return await this.csprojService.findCsproj(csprojDepth, csprojName);
    }
    async readCsproj(csprojPath) {
        core.info(`Reading .csproj file: ${csprojPath}...`);
        return await this.csprojService.readCsproj(csprojPath);
    }
    async updateCsproj(csprojPath, content) {
        core.info(`Updating .csproj file: ${csprojPath}...`);
        await this.csprojService.updateCsproj(csprojPath, content);
    }
    extractVersion(csprojContent) {
        core.info('Extracting version from .csproj content...');
        return this.csprojService.extractVersion(csprojContent);
    }
    updateVersion(csprojContent, newVersion) {
        core.info('Updating version in .csproj content...');
        return this.csprojService.updateVersion(csprojContent, newVersion);
    }
    async processMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        core.info('Processing EF Core migrations...');
        return await this.migrationService.processMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf);
    }
    async rollbackMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf, targetMigration) {
        core.info(`Rolling back to migration: ${targetMigration}...`);
        await this.migrationService.rollbackMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf, targetMigration);
    }
    async getCurrentAppliedMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        core.info('Getting the current applied migration...');
        return await this.migrationService.getCurrentAppliedMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf);
    }
    async getLastNonPendingMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        core.info('Getting the last non-pending migration...');
        return await this.migrationService.getLastNonPendingMigration(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf);
    }
    async installDotnetEfLocally() {
        core.info('Installing dotnet-ef tool locally...');
        await this.dotnetService.installDotnetEf();
    }
    async runTests(envName, testFolder, testOutputFolder, testFormat) {
        core.info('Running tests...');
        await this.testService.runTests(envName, testFolder, testOutputFolder, testFormat);
    }
    async addMigration(migrationName, outputDir, context) {
        core.info(`Adding migration: ${migrationName}...`);
        await this.migrationService.addMigration(migrationName, outputDir, context);
    }
    async updateDatabase(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        core.info('Updating the database...');
        await this.migrationService.updateDatabase(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf);
    }
    async listMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
        core.info('Listing migrations...');
        return await this.migrationService.listMigrations(envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf);
    }
    async cleanTestResults(testOutputFolder) {
        core.info('Cleaning test results...');
        await this.testService.cleanTestResults(testOutputFolder);
    }
    async restorePackages() {
        core.info('Restoring NuGet packages...');
        await this.dotnetService.restorePackages();
    }
    async buildProject(configuration) {
        core.info('Building the .NET project...');
        await this.dotnetService.buildProject(configuration);
    }
}
