import { ef } from './tools/ef.js'

export class ToolService {
  private dotnetRoot: string
  ef: ef

  constructor(dotnetRoot: string, useGlobalDotnetEf: boolean) {
    this.dotnetRoot = dotnetRoot
    this.ef = new ef(this.dotnetRoot, useGlobalDotnetEf)
  }
}
