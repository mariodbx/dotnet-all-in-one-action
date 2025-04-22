import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'

export class DotnetManager {
  constructor(private dependencies = { exec, core }) {}

  private async execDotnetCommand(args: string[], cwd?: string): Promise<void> {
    const options = { cwd }
    await this.dependencies.exec.exec('dotnet', args, options)
  }

  private async getExecDotnetCommandOutput(
    args: string[],
    cwd?: string
  ): Promise<string> {
    let output = ''
    const options = {
      cwd,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString()
        }
      }
    }
    await this.dependencies.exec.exec('dotnet', args, options)
    return output
  }

  // Methods from TestService
  public async runTests(
    envName: string,
    testFolder: string,
    testOutputFolder: string,
    testFormat?: string
  ): Promise<void> {
    core.info(
      `Setting DOTNET_ENVIRONMENT to "${envName}" for test execution...`
    )

    if (!fs.existsSync(testFolder)) {
      throw new Error(`Test folder does not exist: ${testFolder}`)
    }

    process.env.DOTNET_ENVIRONMENT = envName
    core.info(`Running tests in folder: ${testFolder}...`)

    const args = ['test', testFolder, '--verbosity', 'detailed']
    const resolvedOutputFolder = path.resolve(testOutputFolder)

    if (testFormat) {
      const resultFileName = `TestResults.${testFormat}`
      const resultFilePath = path.join(resolvedOutputFolder, resultFileName)
      fs.mkdirSync(resolvedOutputFolder, { recursive: true })
      args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`)
    }

    try {
      core.info(`Executing command: dotnet ${args.join(' ')}`)
      const stdout = await this.getExecDotnetCommandOutput(args)
      core.info(stdout)
      core.info('Tests completed successfully.')
    } catch (error) {
      const errorMessage = `Test execution encountered an error: ${(error as Error).message}`
      core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  public async cleanTestResults(testOutputFolder: string): Promise<void> {
    try {
      core.info(`Cleaning test results in folder: ${testOutputFolder}...`)
      if (fs.existsSync(testOutputFolder)) {
        fs.rmSync(testOutputFolder, { recursive: true, force: true })
        core.info('Test results cleaned successfully.')
      } else {
        core.info('Test output folder does not exist. Nothing to clean.')
      }
    } catch (error) {
      const errorMessage = `Failed to clean test results: ${(error as Error).message}`
      core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Methods from MigrationService
  public async processMigrations(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    try {
      core.info(`Processing migrations for environment: ${envName}`)
      const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`
      const args = [
        efTool,
        'database',
        'update',
        '--project',
        migrationsFolder,
        '--environment',
        envName
      ]
      await this.execDotnetCommand(args, home)
      core.info('Migrations processed successfully')
      return 'Migrations applied successfully'
    } catch (error) {
      const errorMessage = `Failed to process migrations for environment: ${envName}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async rollbackMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean,
    targetMigration: string
  ): Promise<void> {
    try {
      core.info(
        `Rolling back to migration: ${targetMigration} for environment: ${envName}`
      )
      const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`
      const args = [
        efTool,
        'database',
        'update',
        targetMigration,
        '--project',
        migrationsFolder,
        '--environment',
        envName
      ]
      await this.execDotnetCommand(args, home)
      core.info('Migration rolled back successfully')
    } catch (error) {
      const errorMessage = `Failed to rollback to migration: ${targetMigration} for environment: ${envName}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async getCurrentAppliedMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    try {
      if (!useGlobalDotnetEf) {
        core.info('Ensuring local dotnet-ef tool is installed...')
        await this.installDotnetEfLocally()
      }

      const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`
      const args = [
        efTool,
        'migrations',
        'list',
        '--project',
        migrationsFolder,
        '--environment',
        envName
      ]

      const migrationOutput = await this.getExecDotnetCommandOutput(args, home)
      core.info(`Full migration output:\n${migrationOutput}`)

      const appliedMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.includes('[applied]'))
        .map((line) => line.replace(/\[applied\]/i, '').trim())

      const lastApplied =
        appliedMigrations.length > 0 ? appliedMigrations.pop()! : '0'
      core.info(`Current applied migration: ${lastApplied}`)
      return lastApplied
    } catch (error) {
      const errorMessage = `Failed to get current applied migration for environment: ${envName}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async getLastNonPendingMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    try {
      if (!useGlobalDotnetEf) {
        core.info('Ensuring local dotnet-ef tool is installed...')
        await this.installDotnetEfLocally()
      }

      const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`
      const args = [
        efTool,
        'migrations',
        'list',
        '--project',
        migrationsFolder,
        '--environment',
        envName
      ]

      const migrationOutput = await this.getExecDotnetCommandOutput(args, home)
      core.info(`Full migration output:\n${migrationOutput}`)

      const nonPendingMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.trim() && !/\(pending\)/i.test(line))

      const lastMigration =
        nonPendingMigrations.length > 0 ? nonPendingMigrations.pop()! : '0'
      core.info(`Last non-pending migration: ${lastMigration}`)
      return lastMigration
    } catch (error) {
      const errorMessage = `Failed to get last non-pending migration for environment: ${envName}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async addMigration(
    migrationName: string,
    outputDir: string,
    context?: string
  ): Promise<void> {
    const args = ['migrations', 'add', migrationName, '--output-dir', outputDir]
    if (context) {
      args.push('--context', context)
    }
    await this.execDotnetCommand(args)
  }

  public async updateDatabase(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<void> {
    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`
    const args = [
      efTool,
      'database',
      'update',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]
    await this.execDotnetCommand(args, home)
  }

  public async listMigrations(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string[]> {
    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`
    const args = [
      efTool,
      'migrations',
      'list',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]
    const output = await this.getExecDotnetCommandOutput(args, home)
    return output.split('\n').filter((line) => line.trim())
  }

  private async installDotnetEfLocally(): Promise<void> {
    try {
      core.info('Installing dotnet-ef tool locally...')
      const args = ['tool', 'install', '--global', 'dotnet-ef']
      await this.execDotnetCommand(args)
      core.info('dotnet-ef tool installed successfully')
    } catch (error) {
      const errorMessage = 'Failed to install dotnet-ef tool locally'
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  // Methods from DotnetService
  public async installDotnetEf(): Promise<void> {
    try {
      core.info('Installing dotnet-ef tool locally...')
      await this.execDotnetCommand(['new', 'tool-manifest', '--force'])
      await this.execDotnetCommand(['tool', 'install', '--local', 'dotnet-ef'])
    } catch (error) {
      const errorMessage = 'Failed to install dotnet-ef tool locally'
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async publishProject(
    configuration: string,
    outputDir: string,
    additionalFlags: string[] = []
  ): Promise<void> {
    try {
      core.info(`Publishing .NET project with configuration: ${configuration}`)
      await this.execDotnetCommand([
        'publish',
        '-c',
        configuration,
        '-o',
        outputDir,
        ...additionalFlags
      ])
    } catch (error) {
      const errorMessage = `Failed to publish .NET project with configuration: ${configuration}`
      core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  public async restorePackages(): Promise<void> {
    try {
      core.info('Restoring NuGet packages...')
      await this.execDotnetCommand(['restore'])
      core.info('NuGet packages restored successfully.')
    } catch (error) {
      const errorMessage = `Failed to restore NuGet packages: ${(error as Error).message}`
      core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  public async buildProject(configuration: string): Promise<void> {
    try {
      core.info(`Building project with configuration: ${configuration}...`)
      await this.execDotnetCommand(['build', '-c', configuration])
      core.info('Project built successfully.')
    } catch (error) {
      const errorMessage = `Failed to build project: ${(error as Error).message}`
      core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }
}
