import * as core from '@actions/core'
import { InputsManager } from '../inputs-manager/InputsManager.js'
import { GitManager } from '../git-manager/GitManager.js'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import { VersionManager } from '../version-manager/VersionManager.js'

export async function runVersioning(): Promise<void> {
  try {
    const inputs = new InputsManager()
    const gitManager = new GitManager()
    const dotnetManager = new DotnetManager() // Use DotnetManager for csproj operations
    const versionManager = new VersionManager()

    core.info(
      `Configuration: csproj_depth=${inputs.csprojDepth}, csproj_name=${inputs.csprojName}, commit_user=${inputs.commitUser}, commit_email=${inputs.commitEmail}`
    )

    // Get the latest commit message.
    const commitMessage = await gitManager.getLatestCommitMessage()
    core.info(`Latest commit message: "${commitMessage}"`)

    // Determine bump type using VersionManager.
    const bumpType = versionManager.extractBumpType(commitMessage)
    core.info(`Extracted bump type: "${bumpType}"`)
    if (!versionManager.isValidBumpType(bumpType)) {
      core.info(
        'Commit message does not indicate a version bump. Skipping release.'
      )
      core.setOutput('skip_release', 'true')
      return
    }
    core.setOutput('skip_release', 'false')
    core.setOutput('bump_type', bumpType)

    // Validate csproj depth.
    if (isNaN(inputs.csprojDepth) || inputs.csprojDepth < 1) {
      throw new Error('csproj_depth must be a positive integer')
    }

    // Locate the csproj file.
    const csprojPath = await dotnetManager.findFile(
      inputs.csprojDepth,
      inputs.csprojName
    )
    if (!csprojPath) {
      throw new Error(`No csproj file found with name "${inputs.csprojName}"`)
    }
    core.info(`Found csproj file: ${csprojPath}`)

    // Read and parse the csproj file.
    const currentVersion = await dotnetManager.extractVersion(csprojPath)
    core.info(`Current version: ${currentVersion}`)
    core.setOutput('current_version', currentVersion)

    // Calculate the new version using VersionManager.
    const newVersion = VersionManager.bumpVersion(currentVersion, bumpType)
    core.info(`New version: ${newVersion}`)
    core.setOutput('new_version', newVersion)

    // Update the csproj file with the new version.
    await dotnetManager.updateVersion(csprojPath, newVersion)
    core.info(`csproj file updated with new version.`)

    // // Run .NET-specific tasks if needed using DotnetManager.
    // await dotnetManager.restoreDependencies(csprojPath)
    // core.info(`Dependencies restored for ${csprojPath}.`)

    // Update Git with the version bump.
    await gitManager.updateVersion(
      newVersion,
      csprojPath,
      inputs.commitUser,
      inputs.commitEmail,
      inputs.commitMessagePrefix
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
