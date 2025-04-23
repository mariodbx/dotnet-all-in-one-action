import { TestService } from './Services/TestService.js'
// import { MigrationService } from './Services/tools/ef.js'
import { ToolService } from './Services/tools/ToolService.js'
import { ProjectService } from './Services/ProjectService.js'
import * as core from '@actions/core'
import * as exec from '@actions/exec'

export class DotnetManager {
  tests: TestService
  // migrations: MigrationService
  tools: ToolService
  projects: ProjectService
  private dotnetRoot: string
  private core: typeof core
  private exec: typeof exec

  constructor(
    dotnetRoot: string,
    useGlobalDotnetEf: boolean,
    dependencies: { core: typeof core; exec: typeof exec } = { core, exec }
  ) {
    this.dotnetRoot = dotnetRoot
    this.core = dependencies.core
    this.exec = dependencies.exec

    // Initialize services with consistent dependency injection
    this.tests = new TestService()
    this.tools = new ToolService(this.dotnetRoot, useGlobalDotnetEf)
    this.projects = new ProjectService(this.dotnetRoot)
  }
}
