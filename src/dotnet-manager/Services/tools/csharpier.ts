// src/services/tools/CSharpier.ts
import type { IDependencies } from '../../../models/Dependencies.js'
import * as path from 'path'
import * as fs from 'fs'

export class CSharpier {
  constructor(
    private readonly deps: IDependencies,
    private readonly dotnetRoot: string,
    private readonly projectDirectoryRoot: string
  ) {}

  private getTool(): string {
    return 'dotnet'
  }

  private getBaseArgs(): string[] {
    return ['tool', 'run', 'csharpier']
  }

  private async ensureToolManifest(): Promise<void> {
    const manifest = path.join(
      this.projectDirectoryRoot,
      '.config',
      'dotnet-tools.json'
    )
    if (!fs.existsSync(manifest)) {
      this.deps.core.info('Creating dotnet tool manifest…')
      try {
        await this.deps.exec.exec('dotnet', ['new', 'tool-manifest'], {
          cwd: this.projectDirectoryRoot
        })
      } catch (error) {
        const errorMessage = `Failed to create dotnet tool manifest: ${(error as Error).message}`
        this.deps.core.error(errorMessage)
        throw new Error(errorMessage)
      }
    } else {
      this.deps.core.info('✔ Dotnet tool manifest already exists.')
    }
  }

  async ensureInstalled(): Promise<void> {
    try {
      this.deps.core.info('Checking CSharpier…')
      await this.deps.exec.exec(
        this.getTool(),
        [...this.getBaseArgs(), '--version'],
        {
          env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
        }
      )
      this.deps.core.info('✔ CSharpier is already installed.')
    } catch {
      this.deps.core.info('CSharpier not found; installing…')
      await this.install()
    }
  }

  async install(): Promise<void> {
    await this.ensureToolManifest() // Ensure the tool manifest exists without overwriting it

    this.deps.core.info('Installing CSharpier locally…')
    const installArgs = ['tool', 'install', '--local', 'csharpier']
    await this.deps.exec.exec('dotnet', installArgs, {
      cwd: this.projectDirectoryRoot
    })
    this.deps.core.info('✔ CSharpier installed via tool manifest.')
  }

  async format(directory: string): Promise<void> {
    await this.ensureInstalled()
    this.deps.core.info(`Formatting ${directory}…`)
    await this.deps.exec.exec(
      this.getTool(),
      [...this.getBaseArgs(), 'format', directory],
      { cwd: this.projectDirectoryRoot }
    )
    this.deps.core.info('✔ Code formatted.')
  }
}
