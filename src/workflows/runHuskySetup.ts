import * as core from '@actions/core'
import { ToolService } from '../dotnet-manager/Services/ToolService.js'
import { Inputs } from '../utils/Inputs.js'

export async function runHuskySetup(): Promise<void> {
  try {
    const inputs = new Inputs()

    const allowedWords = [
      ...inputs.majorKeywords.split(',').map((word) => word.trim()),
      ...inputs.minorKeywords.split(',').map((word) => word.trim()),
      ...inputs.patchKeywords.split(',').map((word) => word.trim()),
      ...inputs.hotfixKeywords.split(',').map((word) => word.trim()),
      ...inputs.addedKeywords.split(',').map((word) => word.trim()),
      ...inputs.devKeywords.split(',').map((word) => word.trim())
    ]

    const toolService = new ToolService(
      process.env.DOTNET_ROOT || '',
      allowedWords
    )
    core.info('Setting up Husky...')
    await toolService.husky.setupCommitMsgHook()
    core.info('Husky setup completed.')
  } catch (error) {
    core.error('An error occurred during Husky setup.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
