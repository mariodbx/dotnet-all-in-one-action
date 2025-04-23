import * as core from '@actions/core'
import * as exec from '@actions/exec'

export class ef {
  private dotnetRoot: string
  private useGlobalDotnetEf: boolean
  private core: typeof core
  private exec: typeof exec

  constructor(
    dotnetRoot: string,
    useGlobalDotnetEf: boolean,
    dependencies = { core, exec }
  ) {
    {
      this.core = dependencies.core
      this.exec = dependencies.exec
    }
    this.dotnetRoot = dotnetRoot
    this.useGlobalDotnetEf = useGlobalDotnetEf
  }

  private getEfTool(): string {
    if (this.useGlobalDotnetEf) {
      return 'dotnet-ef'
    }
    return 'dotnet'
  }

  private getEfCommand(): string[] {
    if (this.useGlobalDotnetEf) {
      return []
    }
    return ['tool', 'run', 'dotnet-ef']
  }

  async installDotnetEf(): Promise<void> {
    try {
      if (this.useGlobalDotnetEf) {
        // Install globally
        const efCommand = 'dotnet tool install --global dotnet-ef'
        this.core.info('Installing dotnet-ef tool globally...')
        await this.exec.exec('dotnet', efCommand.split(' '), {
          env: { DOTNET_ROOT: this.dotnetRoot }
        })

        // Add the global tools directory to the PATH
        const globalToolPath = `${process.env.HOME}/.dotnet/tools`
        process.env.PATH = `${globalToolPath}:${process.env.PATH}`
        this.core.info(`Added global tool path to PATH: ${globalToolPath}`)
      } else {
        // Install locally using a tool manifest
        this.core.info(
          'Setting up local tool manifest and installing dotnet-ef...'
        )
        const toolManifestArgs = ['new', 'tool-manifest', '--force']
        const installEfArgs = [
          'tool',
          'install',
          '--local',
          'dotnet-ef',
          '--version',
          'latest',
          '--force'
        ]

        // Create the tool manifest
        await this.exec.exec('dotnet', toolManifestArgs, {
          cwd: this.dotnetRoot,
          env: { DOTNET_ROOT: this.dotnetRoot }
        })

        // Install dotnet-ef locally
        await this.exec.exec('dotnet', installEfArgs, {
          cwd: this.dotnetRoot,
          env: { DOTNET_ROOT: this.dotnetRoot }
        })

        this.core.info('dotnet-ef installed locally via tool manifest.')
      }

      this.core.info('dotnet-ef tool installed successfully.')
    } catch (error) {
      const message = `Failed to install dotnet-ef: ${(error as Error).message}`
      this.core.error(message)
      throw new Error(message)
    }
  }

  async processMigrations(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string> {
    let migrationOutput = ''

    const baseEnv: Record<string, string> = {
      DOTNET_ROOT: this.dotnetRoot,
      HOME: process.env.HOME || home,
      ASPNETCORE_ENVIRONMENT: envName
    }

    const migrationOptions: exec.ExecOptions = {
      cwd: migrationsFolder,
      env: baseEnv,
      listeners: {
        stdout: (data: Buffer) => {
          migrationOutput += data.toString()
        }
      }
    }

    const efCmd = this.getEfTool()
    let efArgs = [...this.getEfCommand(), 'migrations', 'list']

    // List migrations to check for pending migrations
    this.core.info(`Listing migrations in folder: ${migrationsFolder}...`)
    await exec.exec(efCmd, efArgs, migrationOptions)

    this.core.info(migrationOutput)

    const pendingMigrations = migrationOutput
      .split('\n')
      .filter((line) => line.trim() && !line.includes('[applied]'))

    let lastMigration = ''

    if (pendingMigrations.length > 0) {
      this.core.info('Pending migrations detected. Applying migrations...')
      lastMigration = pendingMigrations[pendingMigrations.length - 1].trim()
      this.core.info(`Last pending migration: ${lastMigration}`)

      efArgs = [...this.getEfCommand(), 'database', 'update']
      await exec.exec(efCmd, efArgs, migrationOptions)

      this.core.info('Migrations applied successfully.')
    } else {
      this.core.info('No pending migrations detected.')
    }

    return lastMigration
  }

  async rollbackMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    targetMigration: string
  ): Promise<void> {
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
      ]
      await exec.exec(this.getEfTool(), args, { cwd: home })
      core.info('Migration rolled back successfully')
    } catch (error) {
      const message = `Failed to rollback to migration: ${targetMigration} for environment: ${envName}. ${(error as Error).message}`
      core.error(message)
      throw new Error(message)
    }
  }

  async getCurrentAppliedMigration(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string> {
    let migrationOutput = ''

    const baseEnv: Record<string, string> = {
      DOTNET_ROOT: this.dotnetRoot,
      HOME: process.env.HOME || home,
      ASPNETCORE_ENVIRONMENT: envName
    }

    const migrationOptions: exec.ExecOptions = {
      cwd: migrationsFolder,
      env: baseEnv,
      listeners: {
        stdout: (data: Buffer) => {
          migrationOutput += data.toString()
        }
      }
    }

    const efCmd = this.getEfTool()
    const efArgs = [...this.getEfCommand(), 'migrations', 'list']

    await exec.exec(efCmd, efArgs, migrationOptions)

    this.core.info(`Full migration output:\n${migrationOutput}`)

    const appliedMigrations = migrationOutput
      .split('\n')
      .filter((line) => line.includes('[applied]'))
      .map((line) => line.replace(/\[applied\]/i, '').trim())

    const lastApplied =
      appliedMigrations.length > 0
        ? appliedMigrations[appliedMigrations.length - 1]
        : '0'

    this.core.info(`Current applied migration (baseline): ${lastApplied}`)
    return lastApplied
  }

  async getLastNonPendingMigration(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string> {
    let migrationOutput = ''

    const baseEnv: Record<string, string> = {
      DOTNET_ROOT: this.dotnetRoot,
      HOME: process.env.HOME || home,
      ASPNETCORE_ENVIRONMENT: envName
    }

    const migrationOptions: exec.ExecOptions = {
      cwd: migrationsFolder,
      env: baseEnv,
      listeners: {
        stdout: (data: Buffer) => {
          migrationOutput += data.toString()
        }
      }
    }

    const efCmd = this.getEfTool()
    const efArgs = [...this.getEfCommand(), 'migrations', 'list']

    await exec.exec(efCmd, efArgs, migrationOptions)

    this.core.info(`Full migration output:\n${migrationOutput}`)

    const migrationLines = migrationOutput
      .split('\n')
      .map((line) => line.trim())
    const nonPendingMigrations = migrationLines.filter(
      (line) => line !== '' && !/\(pending\)/i.test(line)
    )

    const lastMigration =
      nonPendingMigrations.length > 0
        ? nonPendingMigrations[nonPendingMigrations.length - 1]
        : '0'

    this.core.info(`Last non-pending migration: ${lastMigration}`)
    return lastMigration
  }

  async addMigration(
    migrationName: string,
    outputDir: string,
    context?: string
  ): Promise<void> {
    try {
      const args = [
        ...this.getEfCommand(),
        'migrations',
        'add',
        migrationName,
        '--output-dir',
        outputDir
      ]
      if (context) {
        args.push('--context', context)
      }
      await exec.exec(this.getEfTool(), args)
    } catch (error) {
      const message = `Failed to add migration: ${migrationName}. ${(error as Error).message}`
      core.error(message)
      throw new Error(message)
    }
  }

  async updateDatabase(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<void> {
    try {
      const args = [
        this.getEfTool(),
        'database',
        'update',
        '--project',
        migrationsFolder,
        '--environment',
        envName
      ]
      await exec.exec(this.getEfTool(), args, { cwd: home })
    } catch (error) {
      const message = `Failed to update database for environment: ${envName}. ${(error as Error).message}`
      core.error(message)
      throw new Error(message)
    }
  }

  async listMigrations(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string[]> {
    try {
      const args = [
        ...this.getEfCommand(),
        'migrations',
        'list',
        '--project',
        migrationsFolder,
        '--environment',
        envName
      ]

      let output = ''
      await exec.exec(this.getEfTool(), args, {
        cwd: home,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      })

      return output.split('\n').filter((line) => line.trim())
    } catch (error) {
      const message = `Failed to list migrations for environment: ${envName}. ${(error as Error).message}`
      core.error(message)
      throw new Error(message)
    }
  }
}
