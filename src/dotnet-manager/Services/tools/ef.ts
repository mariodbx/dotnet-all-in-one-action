import type { IDependencies } from '../../../models/Dependencies.js'
import * as fs from 'fs'
import * as path from 'path'

export class EF {
  constructor(
    private readonly deps: IDependencies,
    private readonly dotnetRoot: string,
    private readonly projectDirectoryRoot: string
  ) {}

  private getTool(): string {
    return 'dotnet'
  }

  private getBaseArgs(): string[] {
    return ['tool', 'run', 'dotnet-ef']
  }

  /**
   * Ensure that the .config/dotnet-tools.json manifest exists
   */
  private async ensureToolManifest(): Promise<void> {
    const manifestPath = path.join(
      this.projectDirectoryRoot,
      '.config',
      'dotnet-tools.json'
    )
    if (!fs.existsSync(manifestPath)) {
      this.deps.core.info('Creating dotnet tool manifest…')
      try {
        await this.deps.exec.exec(this.getTool(), ['new', 'tool-manifest'], {
          cwd: this.projectDirectoryRoot
        })
        this.deps.core.info('✔ Tool manifest created.')
      } catch (err) {
        const msg = `Failed to create tool manifest: ${(err as Error).message}`
        this.deps.core.error(msg)
        throw new Error(msg)
      }
    } else {
      this.deps.core.info('✔ Tool manifest already exists.')
    }
  }

  /**
   * Install dotnet-ef as a local tool
   */
  async install(): Promise<void> {
    await this.ensureToolManifest()
    this.deps.core.info('Installing dotnet-ef locally…')
    try {
      await this.deps.exec.exec(
        this.getTool(),
        ['tool', 'install', '--local', 'dotnet-ef'],
        { cwd: this.projectDirectoryRoot }
      )
      this.deps.core.info('✔ dotnet-ef installed.')
    } catch (err) {
      const msg = `Failed to install dotnet-ef: ${(err as Error).message}`
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }

  /**
   * Check for existing install, install if missing
   */
  async ensureInstalled(): Promise<void> {
    try {
      this.deps.core.info('Checking dotnet-ef…')
      await this.deps.exec.exec(
        this.getTool(),
        [...this.getBaseArgs(), '--version'],
        { env: { DOTNET_ROOT: this.dotnetRoot } }
      )
      this.deps.core.info('✔ dotnet-ef already installed.')
    } catch {
      this.deps.core.info('dotnet-ef not found; installing…')
      await this.install()
    }
  }

  /**
   * List and apply pending migrations. Returns the last applied migration name, or empty string if none.
   */
  async processMigrations(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string> {
    await this.ensureInstalled()
    let output = ''
    const env = {
      ...process.env,
      DOTNET_ROOT: this.dotnetRoot,
      HOME: home,
      ASPNETCORE_ENVIRONMENT: envName
    }
    const opts = {
      cwd: migrationsFolder,
      env,
      listeners: {
        stdout: (b: Buffer) => {
          output += b.toString()
        }
      }
    }

    this.deps.core.info(`Listing migrations in ${migrationsFolder}…`)
    await this.deps.exec.exec(
      this.getTool(),
      [...this.getBaseArgs(), 'migrations', 'list'],
      opts
    )

    const pending = output
      .split(/\r?\n/)
      .filter(
        (line) => line.trim() && !line.toLowerCase().includes('[applied]')
      )

    if (pending.length === 0) {
      this.deps.core.info('No pending migrations.')
      return ''
    }

    const last = pending[pending.length - 1].trim()
    this.deps.core.info(`Applying migrations, last: ${last}…`)
    await this.deps.exec.exec(
      this.getTool(),
      [...this.getBaseArgs(), 'database', 'update'],
      opts
    )
    this.deps.core.info('✔ Migrations applied.')

    return last
  }

  /**
   * Rollback to a specific migration
   */
  async rollbackMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    target: string
  ): Promise<void> {
    await this.ensureInstalled()
    const env = {
      ...process.env,
      DOTNET_ROOT: this.dotnetRoot,
      HOME: home,
      ASPNETCORE_ENVIRONMENT: envName
    }
    const opts = {
      cwd: migrationsFolder,
      env,
      listeners: {
        stdout: (b: Buffer) => this.deps.core.info(b.toString()),
        stderr: (b: Buffer) => this.deps.core.error(b.toString())
      }
    }
    try {
      await this.deps.exec.exec(
        this.getTool(),
        [...this.getBaseArgs(), 'database', 'update', target],
        opts
      )
      this.deps.core.info('✔ Rolled back successfully.')
    } catch (err) {
      const msg = `Rollback to "${target}" failed: ${(err as Error).message}`
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }

  /**
   * Get the name of the last applied migration, or '0' if none
   */
  async getCurrentAppliedMigration(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string> {
    await this.ensureInstalled()
    let output = ''
    const env = {
      ...process.env,
      DOTNET_ROOT: this.dotnetRoot,
      HOME: home,
      ASPNETCORE_ENVIRONMENT: envName
    }
    const opts = {
      cwd: migrationsFolder,
      env,
      listeners: {
        stdout: (b: Buffer) => {
          output += b.toString()
        }
      }
    }
    await this.deps.exec.exec(
      this.getTool(),
      [...this.getBaseArgs(), 'migrations', 'list'],
      opts
    )

    const applied = output
      .split(/\r?\n/)
      .filter((line) => line.toLowerCase().includes('[applied]'))
      .map((line) => line.replace(/\[applied\]/i, '').trim())

    if (applied.length === 0) {
      this.deps.core.info('No applied migrations. Returning baseline.')
      return '0'
    }
    const last = applied[applied.length - 1]
    this.deps.core.info(`Current applied: ${last}`)
    return last
  }

  /**
   * Get the name of the last non-pending migration, or '0' if none
   */
  async getLastNonPendingMigration(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string> {
    await this.ensureInstalled()
    let output = ''
    const env = {
      ...process.env,
      DOTNET_ROOT: this.dotnetRoot,
      HOME: home,
      ASPNETCORE_ENVIRONMENT: envName
    }
    const opts = {
      cwd: migrationsFolder,
      env,
      listeners: {
        stdout: (b: Buffer) => {
          output += b.toString()
        }
      }
    }
    await this.deps.exec.exec(
      this.getTool(),
      [...this.getBaseArgs(), 'migrations', 'list'],
      opts
    )

    const lines = output.split(/\r?\n/).map((l) => l.trim())
    const nonPending = lines.filter((l) => l && !/\(pending\)/i.test(l))
    if (nonPending.length === 0) {
      this.deps.core.info('No non-pending migrations. Returning baseline.')
      return '0'
    }
    const last = nonPending[nonPending.length - 1]
    this.deps.core.info(`Last non-pending: ${last}`)
    return last
  }

  /**
   * List all migrations
   */
  async listMigrations(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<string[]> {
    await this.ensureInstalled()
    let output = ''
    const env = {
      ...process.env,
      DOTNET_ROOT: this.dotnetRoot,
      HOME: home,
      ASPNETCORE_ENVIRONMENT: envName
    }
    const opts = {
      cwd: migrationsFolder,
      env,
      listeners: {
        stdout: (b: Buffer) => {
          output += b.toString()
        }
      }
    }
    await this.deps.exec.exec(
      this.getTool(),
      [
        ...this.getBaseArgs(),
        'migrations',
        'list',
        '--project',
        migrationsFolder
      ],
      opts
    )
    return output.split(/\r?\n/).filter((l) => l.trim())
  }

  /**
   * Shortcut for update-database
   */
  async updateDatabase(
    envName: string,
    home: string,
    migrationsFolder: string
  ): Promise<void> {
    await this.ensureInstalled()
    const env = {
      ...process.env,
      DOTNET_ROOT: this.dotnetRoot,
      HOME: home,
      ASPNETCORE_ENVIRONMENT: envName
    }
    try {
      await this.deps.exec.exec(
        this.getTool(),
        [
          ...this.getBaseArgs(),
          'database',
          'update',
          '--project',
          migrationsFolder
        ],
        { cwd: migrationsFolder, env }
      )
      this.deps.core.info('✔ Database updated.')
    } catch (err) {
      const msg = `Database update failed: ${(err as Error).message}`
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }
}

// Example usage:
// import { EfTool } from './services/tools/EfTool.js';
// import { IDependencies } from '../models/Dependencies.js';
// const deps: IDependencies = { core, exec };
// const ef = new EfTool(deps, inputs.dotnetRoot, inputs.projectDirectoryRoot);
// await ef.processMigrations('Development', process.env.HOME||'', './Migrations');
