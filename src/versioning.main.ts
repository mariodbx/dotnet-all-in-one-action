import * as core from '@actions/core'
import { getInputs } from './utils/inputs.js'
import {
  findCsprojFile,
  readCsprojFile,
  extractVersion
} from './utils/csproj.js'

export async function runVersioning(): Promise<void> {
  const inputs = getInputs()
  if (!inputs.runVersioning) {
    core.info('Skipping versioning as per input.')
    return
  }

  try {
    const csprojPath = await findCsprojFile(
      inputs.csprojDepth,
      inputs.csprojName
    )
    const csprojContent = await readCsprojFile(csprojPath)
    const currentVersion = extractVersion(csprojContent)
    core.info(`Current version: ${currentVersion}`)
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
