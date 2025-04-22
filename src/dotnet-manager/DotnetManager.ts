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

  // TestService
  public async runTests(
    envName: string,
    testFolder: string,
    testOutputFolder: string,
    testFormat?: string
  ): Promise<void> {
    this.dependencies.core.info(`Setting DOTNET_ENVIRONMENT to "${envName}"...`)

    if (!fs.existsSync(testFolder)) {
      throw new Error(`Test folder does not exist: ${testFolder}`)
    }

    process.env.DOTNET_ENVIRONMENT = envName
    this.dependencies.core.info(`Running tests in folder: ${testFolder}...`)

    const args = ['test', testFolder, '--verbosity', 'detailed']
    const resolvedOutputFolder = path.resolve(testOutputFolder)

    if (testFormat) {
      const resultFileName = `TestResults.${testFormat}`
      const resultFilePath = path.join(resolvedOutputFolder, resultFileName)
      fs.mkdirSync(resolvedOutputFolder, { recursive: true })
      args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`)
    }

    try {
      const stdout = await this.getExecDotnetCommandOutput(args)
      this.dependencies.core.info(stdout)
      this.dependencies.core.info('Tests completed successfully.')
    } catch (error) {
      const msg = `Test execution error: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
    }
  }

  public async cleanTestResults(testOutputFolder: string): Promise<void> {
    try {
      if (fs.existsSync(testOutputFolder)) {
        fs.rmSync(testOutputFolder, { recursive: true, force: true })
        this.dependencies.core.info('Test results cleaned.')
      } else {
        this.dependencies.core.info('No test results to clean.')
      }
    } catch (error) {
      const msg = `Clean test results failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
    }
  }

  // MigrationService
  public async processMigrations(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string> {
    try {
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
      return 'Migrations applied successfully'
    } catch (error) {
      const msg = `Migration failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
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
    } catch (error) {
      const msg = `Rollback migration failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
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
        await this.installDotnetEf()
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

      const output = await this.getExecDotnetCommandOutput(args, home)
      const applied = output
        .split('\n')
        .filter((line) => line.includes('[applied]'))
        .map((line) => line.replace('[applied]', '').trim())

      return applied.length > 0 ? applied.pop()! : '0'
    } catch (error) {
      const msg = `Fetch current migration failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
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
        await this.installDotnetEf()
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

      const output = await this.getExecDotnetCommandOutput(args, home)
      const nonPending = output
        .split('\n')
        .filter((line) => line.trim() && !line.includes('(pending)'))

      return nonPending.length > 0 ? nonPending.pop()! : '0'
    } catch (error) {
      const msg = `Get non-pending migration failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
    }
  }

  public async addMigration(
    migrationName: string,
    outputDir: string,
    context?: string
  ): Promise<void> {
    const args = [
      'ef',
      'migrations',
      'add',
      migrationName,
      '--output-dir',
      outputDir
    ]
    if (context) {
      args.push('--context', context)
    }

    await this.execDotnetCommand(['dotnet', ...args])
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

  public async installDotnetEfLocally(): Promise<void> {
    try {
      const args = ['tool', 'install', '--global', 'dotnet-ef']
      await this.execDotnetCommand(args)
    } catch (error) {
      const msg = `Global dotnet-ef install failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
    }
  }

  public async installDotnetEf(): Promise<void> {
    try {
      this.dependencies.core.info('Creating or overwriting tool manifest...')
      await this.execDotnetCommand(['new', 'tool-manifest', '--force'])
      this.dependencies.core.info('Installing dotnet-ef as local tool...')
      await this.execDotnetCommand(['tool', 'install', 'dotnet-ef'])
      this.dependencies.core.info('dotnet-ef tool installed locally.')
    } catch (error) {
      const msg = `Local dotnet-ef install failed: ${(error as Error).message}`
      this.dependencies.core.error(msg)
      throw new Error(msg)
    }
  }
}
