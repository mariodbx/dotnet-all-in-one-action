import * as core from '@actions/core'
import { IDotnetService } from './interfaces/IDotnetService.js'
import { ICsprojService } from './interfaces/ICsprojService.js'
import { IMigrationService } from './interfaces/IMigrationService.js'
import { TestService } from './services/TestService.js'
import { MigrationService } from './services/MigrationService.js'
import { CsprojService } from './services/CsprojService.js'
import { DotnetService } from './services/DotnetService.js'
import { ITestService } from './interfaces/ITestService.js'

export class DotnetManager {
  private dotnetService: IDotnetService
  private csprojService: ICsprojService
  private migrationService: IMigrationService
  private testService: ITestService

  constructor(
    dotnetService: IDotnetService = new DotnetService(),
    csprojService: ICsprojService = new CsprojService(),
    migrationService: IMigrationService = new MigrationService(),
    testService: ITestService = new TestService()
  ) {
    this.dotnetService = dotnetService
    this.csprojService = csprojService
    this.migrationService = migrationService
    this.testService = testService
  }

  public async installDotnetEf(): Promise<void> {
    core.info('Installing dotnet-ef tool...')
    await this.dotnetService.installDotnetEf()
  }

  public async publishProject(
    configuration: string,
    outputDir: string,
    additionalFlags: string[] = []
  ): Promise<void> {
    core.info('Publishing .NET project...')
    await this.dotnetService.publishProject(
      configuration,
      outputDir,
      additionalFlags
    )
  }

  public async findCsproj(
    csprojDepth: number,
    csprojName: string
  ): Promise<string> {
    core.info(
      `Searching for .csproj file: ${csprojName} within depth ${csprojDepth}...`
    )
    return await this.csprojService.findCsproj(csprojDepth, csprojName)
  }

  public async readCsproj(csprojPath: string): Promise<string> {
    core.info(`Reading .csproj file: ${csprojPath}...`)
    return await this.csprojService.readCsproj(csprojPath)
  }

  public async updateCsproj(
    csprojPath: string,
    content: string
  ): Promise<void> {
    core.info(`Updating .csproj file: ${csprojPath}...`)
    await this.csprojService.updateCsproj(csprojPath, content)
  }

  public extractVersion(csprojContent: string): string {
    core.info('Extracting version from .csproj content...')
    return this.csprojService.extractVersion(csprojContent)
  }

  public updateVersion(csprojContent: string, newVersion: string): string {
    core.info('Updating version in .csproj content...')
    return this.csprojService.updateVersion(csprojContent, newVersion)
  }

  public async processMigrations(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    core.info('Processing EF Core migrations...')
    return await this.migrationService.processMigrations(
      envName,
      home,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
  }

  public async rollbackMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean,
    targetMigration: string
  ): Promise<void> {
    core.info(`Rolling back to migration: ${targetMigration}...`)
    await this.migrationService.rollbackMigration(
      envName,
      home,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf,
      targetMigration
    )
  }

  public async getCurrentAppliedMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    core.info('Getting the current applied migration...')
    return await this.migrationService.getCurrentAppliedMigration(
      envName,
      home,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
  }

  public async getLastNonPendingMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    core.info('Getting the last non-pending migration...')
    return await this.migrationService.getLastNonPendingMigration(
      envName,
      home,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
  }

  public async installDotnetEfLocally(): Promise<void> {
    core.info('Installing dotnet-ef tool locally...')
    await this.dotnetService.installDotnetEf()
  }

  public async runTests(
    envName: string,
    testFolder: string,
    testOutputFolder: string,
    testFormat?: string
  ): Promise<void> {
    core.info('Running tests...')
    await this.testService.runTests(
      envName,
      testFolder,
      testOutputFolder,
      testFormat
    )
  }

  public async addMigration(
    migrationName: string,
    outputDir: string,
    context?: string
  ): Promise<void> {
    core.info(`Adding migration: ${migrationName}...`)
    await this.migrationService.addMigration(migrationName, outputDir, context)
  }

  public async updateDatabase(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<void> {
    core.info('Updating the database...')
    await this.migrationService.updateDatabase(
      envName,
      home,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
  }

  public async listMigrations(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string[]> {
    core.info('Listing migrations...')
    return await this.migrationService.listMigrations(
      envName,
      home,
      migrationsFolder,
      dotnetRoot,
      useGlobalDotnetEf
    )
  }

  public async cleanTestResults(testOutputFolder: string): Promise<void> {
    core.info('Cleaning test results...')
    await this.testService.cleanTestResults(testOutputFolder)
  }

  public async restorePackages(): Promise<void> {
    core.info('Restoring NuGet packages...')
    await this.dotnetService.restorePackages()
  }

  public async buildProject(configuration: string): Promise<void> {
    core.info('Building the .NET project...')
    await this.dotnetService.buildProject(configuration)
  }
}
