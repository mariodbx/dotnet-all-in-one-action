import { ef } from './tools/ef.js'
import { csharpier } from './tools/csharpier.js'

export class ToolService {
  private dotnetRoot: string
  ef: ef
  csharpier: csharpier

  constructor(dotnetRoot: string, useGlobalDotnetEf: boolean) {
    this.dotnetRoot = dotnetRoot
    this.ef = new ef(this.dotnetRoot, useGlobalDotnetEf)
    this.csharpier = new csharpier(this.dotnetRoot, false)
  }
}
