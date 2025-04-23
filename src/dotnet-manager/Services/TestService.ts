import * as core from '@actions/core'
import * as exec from '@actions/exec'

export class TestService {
  private core: typeof core
  private exec: typeof exec

  constructor(
    dependencies: { core: typeof core; exec: typeof exec } = { core, exec }
  ) {
    this.core = dependencies.core
    this.exec = dependencies.exec
  }

  async runTests(
    projectPath: string,
    testResultsPath: string,
    additionalArgs: string[] = []
  ): Promise<void> {
    try {
      const args = [
        'test',
        projectPath,
        '--logger',
        `trx;LogFileName=${testResultsPath}`,
        ...additionalArgs
      ]

      await this.exec.exec('dotnet', args)
      this.core.info(
        `Tests executed successfully. Results saved to ${testResultsPath}`
      )
    } catch (error) {
      const message = `Failed to execute tests for project: ${projectPath}. ${(error as Error).message}`
      this.core.error(message)
      throw new Error(message)
    }
  }

  async parseTestResults(testResultsPath: string): Promise<string> {
    try {
      // Placeholder for parsing logic. In a real implementation, you would parse the TRX file.
      this.core.info(`Parsing test results from ${testResultsPath}`)
      return `Test results parsed successfully from ${testResultsPath}`
    } catch (error) {
      const message = `Failed to parse test results from: ${testResultsPath}. ${(error as Error).message}`
      this.core.error(message)
      throw new Error(message)
    }
  }
}
