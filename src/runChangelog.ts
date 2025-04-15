import * as core from '@actions/core'
import { generateChangelog } from './utils/changelog.js'
import { getInputs } from './utils/inputs.js'

export async function runChangelog(): Promise<void> {
  try {
    const inputs = getInputs()

    if (!inputs.runChangelog) {
      core.info('Skipping changelog generation as per input.')
      return
    }

    const changelog = await generateChangelog()
    core.setOutput('changelog', changelog)
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
