// src/DotnetManager.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Inputs } from '../utils/Inputs.js'
import { IDependencies } from '../models/Dependencies.js'
import { TestService } from './Services/TestService.js'
import { ProjectService } from './Services/ProjectService.js'
import { ToolService } from './Services/ToolService.js'
import { Csproj } from './utils/Csproj.js'
import { Version } from './utils/Version.js'

export class DotnetManager {
  readonly deps: IDependencies
  readonly inputs: Inputs

  readonly tests: TestService
  readonly projects: ProjectService
  readonly tools: ToolService
  readonly Csproj = Csproj
  readonly Version = Version

  constructor(
    deps: IDependencies = { core, exec },
    inputs: Inputs = new Inputs()
  ) {
    this.deps = deps
    this.inputs = inputs

    this.tests = new TestService(
      deps,
      inputs.dotnetRoot,
      inputs.testFolder,
      inputs.uploadTestsResults,
      inputs.testOutputFolder,
      inputs.testFormat
    )
    this.projects = new ProjectService(deps, inputs.dotnetRoot)

    // PASS the grouped keywords map, not a big flat string array:
    this.tools = new ToolService(
      deps,
      inputs.dotnetRoot,
      inputs.projectDirectoryRoot,
      inputs.keywordGroups
    )
  }
}
