import * as core from '@actions/core'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'

export async function runHuskySetup(): Promise<void> {
  try {
    // const inputs = new Inputs()

    // const allowedWords = [
    //   ...inputs.majorKeywords.split(',').map((word) => word.trim()),
    //   ...inputs.minorKeywords.split(',').map((word) => word.trim()),
    //   ...inputs.patchKeywords.split(',').map((word) => word.trim()),
    //   ...inputs.hotfixKeywords.split(',').map((word) => word.trim()),
    //   ...inputs.addedKeywords.split(',').map((word) => word.trim()),
    //   ...inputs.devKeywords.split(',').map((word) => word.trim())
    // ]

    const dotnet = new DotnetManager()
    core.info('Setting up Husky...')
    await dotnet.tools.husky.setupCommitMsgHook()
    core.info('Husky setup completed.')
  } catch (error) {
    core.error('An error occurred during Husky setup.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
