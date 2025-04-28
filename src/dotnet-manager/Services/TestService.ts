// src/services/TestService.ts
import { IDependencies } from '../../models/Dependencies.js'

export class TestService {
  constructor(
    private readonly deps: IDependencies,
    private readonly dotnetRoot: string,
    private readonly testFolder: string,
    private readonly uploadResults: boolean,
    private readonly resultsFolder: string,
    private readonly resultsFormat: string
  ) {}

  private getLoggerFlag(): string[] {
    return this.uploadResults ? ['--logger'] : []
  }

  private getLoggerArg(): string[] {
    if (!this.uploadResults) return []
    return [
      `${this.resultsFormat};LogFileName=${this.resultsFolder}.${this.resultsFormat}`
    ]
  }

  async runTests(additionalArgs: string[] = []): Promise<void> {
    const args = [
      'test',
      this.testFolder,
      ...this.getLoggerFlag(),
      ...this.getLoggerArg(),
      ...additionalArgs
    ]
    try {
      await this.deps.exec.exec('dotnet', args, {
        env: {
          ...process.env,
          DOTNET_ROOT: this.dotnetRoot,
          HOME: process.env.HOME || '/home/node' // Ensure HOME is set
        }
      })
      this.deps.core.info(
        `✔ Tests passed. Results in ${this.resultsFolder}.${this.resultsFormat}`
      )
    } catch (err) {
      const msg = (err as Error).message
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }
}
