// src/Services/ToolService.ts
import type { IDependencies } from '../../models/Dependencies.js'
import { EF } from './tools/ef.js'
import { CSharpier } from './tools/csharpier.js'
import { Husky } from './tools/husky.js'

export class ToolService {
  readonly ef: EF
  readonly csharpier: CSharpier
  readonly husky: Husky

  constructor(
    readonly deps: IDependencies,
    dotnetRoot: string,
    projectDirectoryRoot: string,
    // Now a map of groups → keyword lists
    keywordGroups: Record<string, string[]>
  ) {
    this.ef = new EF(deps, dotnetRoot, projectDirectoryRoot)
    this.csharpier = new CSharpier(deps, dotnetRoot, projectDirectoryRoot)
    this.husky = new Husky(deps, projectDirectoryRoot, keywordGroups)
  }
}
