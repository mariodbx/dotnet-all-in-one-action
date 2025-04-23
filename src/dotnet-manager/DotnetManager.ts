import { TestService } from './Services/TestService.js'
// import { MigrationService } from './Services/tools/ef.js'
import { ToolService } from './Services/ToolService.js'
import { ProjectService } from './Services/ProjectService.js'
import { Csproj } from '../utils/Csproj.js'

export class DotnetManager {
  tests: TestService
  // migrations: MigrationService
  tools: ToolService
  projects: ProjectService
  csproj: typeof Csproj
  private dotnetRoot: string

  constructor(dotnetRoot: string, useGlobalDotnetEf: boolean) {
    this.dotnetRoot = dotnetRoot

    // Initialize services with consistent dependency injection
    this.tests = new TestService()
    this.tools = new ToolService(this.dotnetRoot, useGlobalDotnetEf)
    this.projects = new ProjectService(this.dotnetRoot)
    this.csproj = Csproj
  }
}
// const dotnet = new DotnetManager(
//   core.getInput('dotnet-root') || '',
//   core.getInput('use-global-dotnet-ef') === 'true'
// )
