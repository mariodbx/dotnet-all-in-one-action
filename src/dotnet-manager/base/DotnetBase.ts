import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IDotnetDependencies } from '../interfaces/IDotnetDependencies.js'

export abstract class DotnetBase {
  protected exec: IDotnetDependencies['exec']
  protected core: IDotnetDependencies['core']

  constructor(dependencies: IDotnetDependencies = { exec, core }) {
    this.exec = dependencies.exec
    this.core = dependencies.core
  }

  protected async execDotnetCommand(
    args: string[],
    cwd?: string
  ): Promise<void> {
    try {
      await this.exec.exec('dotnet', args, cwd ? { cwd } : undefined)
    } catch (error) {
      const errorMessage = `Dotnet command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  protected async getExecDotnetCommandOutput(
    args: string[],
    cwd?: string
  ): Promise<string> {
    try {
      let output = ''
      const options = {
        cwd,
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }
      await this.exec.exec('dotnet', args, options)
      return output
    } catch (error) {
      const errorMessage = `Dotnet command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }
}
