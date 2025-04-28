// src/DotnetManager.ts
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { Inputs } from '../utils/Inputs.js';
import { TestService } from './Services/TestService.js';
import { ProjectService } from './Services/ProjectService.js';
import { ToolService } from './Services/ToolService.js';
import { Csproj } from './utils/Csproj.js';
import { Version } from './utils/Version.js';
export class DotnetManager {
    deps; //private
    inputs = new Inputs();
    tests;
    projects;
    tools;
    Csproj = Csproj;
    Version = Version;
    constructor(deps = { core, exec }, inputs = new Inputs()) {
        this.deps = deps;
        this.inputs = inputs;
        // instantiate all child services with the same deps & config
        this.tests = new TestService(deps, inputs.dotnetRoot, inputs.testFolder, inputs.uploadTestsResults, inputs.testOutputFolder, inputs.testFormat);
        this.projects = new ProjectService(deps, inputs.dotnetRoot);
        this.tools = new ToolService(deps, inputs.dotnetRoot, inputs.projectDirectoryRoot, [
            ...inputs.majorKeywords,
            ...inputs.minorKeywords,
            ...inputs.patchKeywords,
            ...inputs.hotfixKeywords,
            ...inputs.addedKeywords,
            ...inputs.devKeywords
        ]);
    }
}
