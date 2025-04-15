import * as core from '@actions/core'
import { getInputs } from './utils/inputs.js'
import { getLatestCommitMessage, updateGit } from './utils/git.js'
import {
  findCsprojFile,
  readCsprojFile,
  updateCsprojFile,
  extractVersion,
  updateVersionContent
} from './utils/csproj.js'
import { parseVersion, bumpVersion } from './utils/versioning.js'

export async function runVersioning(): Promise<void> {
  try {
    const inputs = getInputs()
    let bumpType = '' // Declare bumpType in a broader scope.

    core.info(
      `Configuration: csproj_depth=${inputs.csprojDepth}, csproj_name=${inputs.csprojName}, commit_user=${inputs.commitUser}, commit_email=${inputs.commitEmail}`
    )

    // Get the latest commit message.
    try {
      const commitMessage = await getLatestCommitMessage(inputs.showFullOutput)
      core.info(`Latest commit message: "${commitMessage}"`)

      // Extract bump type using a more robust search.
      const regexMatch = commitMessage.match(/(patch|minor|major)/i)
      bumpType = regexMatch ? regexMatch[1].toLowerCase() : ''
      core.info(`Extracted bump type: "${bumpType}"`)

      if (!['patch', 'minor', 'major'].includes(bumpType)) {
        core.info(
          'Commit message does not indicate a version bump. Skipping release.'
        )
        core.setOutput('skip_release', 'true')
        return
      }
      core.setOutput('skip_release', 'false')
      core.setOutput('bump_type', bumpType)
    } catch (error) {
      core.setFailed(`Error processing commit message: ${error}`)
      throw error
    }

    // Validate csproj depth.
    if (isNaN(inputs.csprojDepth) || inputs.csprojDepth < 1) {
      throw new Error('csproj_depth must be a positive integer')
    }

    // Locate the csproj file.
    const csprojPath = await findCsprojFile(
      inputs.csprojDepth,
      inputs.csprojName
    )
    core.info(`Found csproj file: ${csprojPath}`)

    // Read and parse the csproj file.
    const csprojContent = await readCsprojFile(csprojPath)
    const currentVersion = extractVersion(csprojContent)
    core.info(`Current version: ${currentVersion}`)
    core.setOutput('current_version', currentVersion)

    const versionData = parseVersion(currentVersion)
    const newVersion = bumpVersion(versionData, bumpType)
    core.info(`New version: ${newVersion}`)
    core.setOutput('new_version', newVersion)

    // Update the csproj file with the new version.
    const newCsprojContent = updateVersionContent(csprojContent, newVersion)
    await updateCsprojFile(csprojPath, newCsprojContent)
    core.info(`csproj file updated with new version.`)

    // Update Git with the version bump.
    await updateGit(
      newVersion,
      csprojPath,
      inputs.commitUser,
      inputs.commitEmail,
      inputs.commitMessagePrefix,
      inputs.showFullOutput
    )
    core.info(`Version bump process completed successfully.`)
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
    throw error
  }
}
