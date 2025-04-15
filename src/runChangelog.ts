import * as core from '@actions/core'
import { generateChangelog } from './utils/changelog.js'

export async function runChangelog(): Promise<void> {
  try {
    const changelog = await generateChangelog()
    core.setOutput('changelog', changelog)
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
