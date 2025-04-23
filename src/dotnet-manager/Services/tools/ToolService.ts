import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { ef } from './ef.js'

export class ToolService {
  private dotnetRoot: string
  private useGlobalDotnetEf: boolean
  private core: typeof core
  private exec: typeof exec
  ef: ef

  constructor(
    dotnetRoot: string,
    useGlobalDotnetEf: boolean,
    dependencies = { core, exec }
  ) {
    this.dotnetRoot = dotnetRoot
    this.useGlobalDotnetEf = useGlobalDotnetEf
    this.core = dependencies.core
    this.exec = dependencies.exec
    this.ef = new ef(this.dotnetRoot, useGlobalDotnetEf)
  }
}
