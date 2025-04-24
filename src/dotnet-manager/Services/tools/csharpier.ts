import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'

export class csharpier {
  private dotnetRoot: string
  // private useGlobalCsharpier: boolean
  private core: typeof core
  private exec: typeof exec

  constructor(dotnetRoot: string, dependencies = { core, exec }) {
    this.dotnetRoot = dotnetRoot
    this.core = dependencies.core || core
    this.exec = dependencies.exec || exec
  }

  private getCsharpierTool(): string {
    return 'dotnet'
  }

  private getCsharpierCommand(): string[] {
    return ['tool', 'run', 'csharpier']
  }

  async ensureLocalCsharpierInstalled(): Promise<void> {
    try {
      const csharpierCmd = this.getCsharpierTool()
      const csharpierArgs = [...this.getCsharpierCommand(), '--version']

      this.core.info('Checking if CSharpier is installed locally...')
      await this.exec.exec(csharpierCmd, csharpierArgs, {
        env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
      })
      this.core.info('CSharpier is already installed locally.')
    } catch {
      this.core.info('CSharpier is not installed locally. Installing...')
      await this.install()
    }
  }

  async install(): Promise<void> {
    try {
      this.core.info('Installing CSharpier locally...')
      const toolManifestArgs = ['new', 'tool-manifest', '--force']
      const installCsharpierArgs = ['tool', 'install', '--local', 'csharpier']

      const writableDir = path.join(process.env.HOME || '/tmp', '.dotnet-tools')
      if (!fs.existsSync(writableDir)) {
        fs.mkdirSync(writableDir, { recursive: true })
      }

      const updatedEnv = {
        ...process.env,
        DOTNET_ROOT: this.dotnetRoot,
        PATH: `${writableDir}:${process.env.PATH}`
      }

      // Create the tool manifest
      this.core.info(`Running: dotnet ${toolManifestArgs.join(' ')}`)
      await this.exec.exec('dotnet', toolManifestArgs, {
        cwd: writableDir,
        env: updatedEnv
      })
      this.core.info('Tool manifest created successfully.')

      // Install CSharpier locally
      this.core.info(`Running: dotnet ${installCsharpierArgs.join(' ')}`)
      await this.exec.exec('dotnet', installCsharpierArgs, {
        cwd: writableDir,
        env: updatedEnv
      })
      this.core.info('CSharpier installed locally via tool manifest.')
    } catch (error) {
      const errorMessage = `Failed to install CSharpier: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  async format(directory: string): Promise<void> {
    await this.ensureLocalCsharpierInstalled()
    try {
      const csharpierCmd = this.getCsharpierTool()
      const csharpierArgs = [...this.getCsharpierCommand(), directory]

      this.core.info(`Formatting code in directory: ${directory}...`)
      await this.exec.exec(csharpierCmd, csharpierArgs, {
        env: { ...process.env, DOTNET_ROOT: this.dotnetRoot }
      })
      this.core.info('Code formatted successfully.')
    } catch (error) {
      const errorMessage = `Failed to format code in directory: ${directory}. ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }
}
