import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { DotnetBase } from '../base/DotnetBase.js'
import { ITestService } from '../interfaces/ITestService.js'

export class TestService extends DotnetBase implements ITestService {
  constructor(dependencies = { exec, core }) {
    super(dependencies)
  }

  public async runTests(
    envName: string,
    testFolder: string,
    testOutputFolder: string,
    testFormat?: string
  ): Promise<void> {
    this.core.info(
      `Setting DOTNET_ENVIRONMENT to "${envName}" for test execution...`
    )

    if (!fs.existsSync(testFolder)) {
      throw new Error(`Test folder does not exist: ${testFolder}`)
    }

    process.env.DOTNET_ENVIRONMENT = envName
    this.core.info(`Running tests in folder: ${testFolder}...`)

    const args = ['test', testFolder, '--verbosity', 'detailed']
    const resolvedOutputFolder = path.resolve(testOutputFolder)

    if (testFormat) {
      const resultFileName = `TestResults.${testFormat}`
      const resultFilePath = path.join(resolvedOutputFolder, resultFileName)
      fs.mkdirSync(resolvedOutputFolder, { recursive: true })
      args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`)
    }

    try {
      this.core.info(`Executing command: dotnet ${args.join(' ')}`)
      const stdout = await this.getExecDotnetCommandOutput(args)

      this.core.info(stdout)
      this.core.info('Tests completed successfully.')
    } catch (error) {
      const errorMessage = `Test execution encountered an error: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }
}
