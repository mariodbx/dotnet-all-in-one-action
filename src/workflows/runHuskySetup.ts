import * as core from '@actions/core'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'

export async function runHuskySetup() {
  const dotnet = new DotnetManager()
  await dotnet.tools.husky.setupCommitMsgHook()
  core.info('✅ .husky/commit-msg hook in place.')
}
