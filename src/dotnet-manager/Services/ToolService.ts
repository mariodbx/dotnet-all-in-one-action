import { ef } from './tools/ef.js'
import { csharpier } from './tools/csharpier.js'
import { husky } from './tools/husky.js'

export class ToolService {
  private dotnetRoot: string
  ef: ef
  csharpier: csharpier
  husky: husky

  constructor(dotnetRoot: string, allowedKeywords: string[]) {
    this.dotnetRoot = dotnetRoot
    this.ef = new ef(this.dotnetRoot)
    this.csharpier = new csharpier(this.dotnetRoot)
    this.husky = new husky(allowedKeywords)
  }
}
