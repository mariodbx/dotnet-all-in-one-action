import * as core from '@actions/core'
import { Inputs } from '../utils/Inputs.js'
import { GitManager } from '../git-manager/GitManager.js'
import { Version } from '../dotnet-manager/utils/Version.js'
import { Timer } from '../utils/Timer.js'
import { Csproj } from '../dotnet-manager/utils/Csproj.js'

export async function runVersioning(): Promise<void> {
  try {
    const inputs = new Inputs()
    const gitManager = new GitManager()

    core.info(
      `Configuration: csproj_depth=${inputs.csprojDepth}, csproj_name=${inputs.csprojName}, commit_user=${inputs.commitUser}, commit_email=${inputs.commitEmail}`
    )

    // Wait and fetch the latest changes
    await Timer.wait(5000)
    core.info('Waiting for 5 seconds before ensuring the latest version...')
    await gitManager.repo.pull('.', 'oop' /*process.env['GITHUB_REF_NAME']*/)
    core.info('Fetched the latest changes from the repository.')

    // Get the latest commit message
    const commitMessage = await gitManager.getLatestCommitMessage()
    core.info(`Latest commit message: "${commitMessage}"`)

    // Determine bump type
    const bumpType = Version.extractBumpType(commitMessage)
    core.info(`Extracted bump type: "${bumpType}"`)
    if (!Version.isValidBumpType(bumpType)) {
      core.info(
        'Commit message does not indicate a version bump. Skipping release.'
      )
      core.setOutput('skip_release', 'true')
      return
    }
    core.setOutput('skip_release', 'false')
    core.setOutput('bump_type', bumpType)

    // Validate csproj depth
    if (isNaN(inputs.csprojDepth) || inputs.csprojDepth < 1) {
      throw new Error('csproj_depth must be a positive integer')
    }

    // Locate the csproj file
    const csprojPath = await Csproj.findCsproj(
      inputs.csprojDepth,
      inputs.csprojName
    )
    core.info(`Found csproj file: ${csprojPath}`)

    // Read and parse the csproj file
    const csprojContent = await Csproj.readCsproj(csprojPath)
    const currentVersion = Csproj.extractVersion(csprojContent)
    core.info(`Current version: ${currentVersion}`)
    core.setOutput('current_version', currentVersion)

    // Calculate the new version
    const oldVersion = Version.parseVersion(currentVersion)
    const newVersion = Version.bumpVersion(oldVersion, bumpType)
    core.info(`Bumping version from ${oldVersion} to ${newVersion}`)
    core.setOutput('new_version', newVersion)

    // Update the csproj file with the new version
    const updatedContent = Csproj.updateVersion(csprojContent, newVersion)
    await Csproj.updateCsproj(csprojPath, updatedContent)
    core.info(`Updated csproj file with new version: ${newVersion}`)

    // Commit and push the version bump
    await gitManager.repo.commitAndPush(
      '.',
      `${inputs.commitMessagePrefix} Bump version to ${newVersion}`
    )
    core.info(`Version bump process completed successfully.`)
  } catch (error: unknown) {
    core.setFailed(error instanceof Error ? error.message : String(error))
    throw error
  }
}
