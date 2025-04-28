// src/services/ProjectService.ts
import { IDependencies } from '../../models/Dependencies.js'

export class ProjectService {
  constructor(
    private readonly deps: IDependencies,
    private readonly dotnetRoot: string
  ) {}

  async publish(
    configuration: string,
    outputDir: string,
    additionalFlags: string[] = []
  ): Promise<void> {
    this.deps.core.info(
      `Publishing .NET project (${configuration}) → ${outputDir}`
    )
    try {
      await this.deps.exec.exec(
        'dotnet',
        ['publish', '-c', configuration, '-o', outputDir, ...additionalFlags],
        { env: { DOTNET_ROOT: this.dotnetRoot } }
      )
      this.deps.core.info('✔ Project published.')
    } catch (err) {
      const msg = `Publish failed (${configuration}): ${(err as Error).message}`
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }

  async restorePackages(): Promise<void> {
    this.deps.core.info('Restoring NuGet packages…')
    try {
      await this.deps.exec.exec('dotnet', ['restore'], {
        env: { DOTNET_ROOT: this.dotnetRoot }
      })
      this.deps.core.info('✔ Packages restored.')
    } catch (err) {
      const msg = `Restore failed: ${(err as Error).message}`
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }

  async build(configuration: string): Promise<void> {
    this.deps.core.info(`Building project (${configuration})…`)
    try {
      await this.deps.exec.exec('dotnet', ['build', '-c', configuration], {
        env: { DOTNET_ROOT: this.dotnetRoot }
      })
      this.deps.core.info('✔ Build succeeded.')
    } catch (err) {
      const msg = `Build failed: ${(err as Error).message}`
      this.deps.core.error(msg)
      throw new Error(msg)
    }
  }
}
