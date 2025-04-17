import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IDotnetService } from '../interfaces/IDotnetService.js'
import { DotnetBase } from '../base/DotnetBase.js'

export class DotnetService extends DotnetBase implements IDotnetService {
  constructor(dependencies = { exec, core }) {
    super(dependencies)
  }

  async installDotnetEf(): Promise<void> {
    try {
      this.core.info('Installing dotnet-ef tool locally...')
      await this.execDotnetCommand(['new', 'tool-manifest', '--force'])
      await this.execDotnetCommand(['tool', 'install', '--local', 'dotnet-ef'])
    } catch (error) {
      const errorMessage = 'Failed to install dotnet-ef tool locally'
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }

  async publishProject(
    configuration: string,
    outputDir: string,
    additionalFlags: string[] = []
  ): Promise<void> {
    try {
      this.core.info(
        `Publishing .NET project with configuration: ${configuration}`
      )
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
      this.core.error(errorMessage)
      throw new Error(
        `${errorMessage}. Original error: ${(error as Error).message}`
      )
    }
  }
}
