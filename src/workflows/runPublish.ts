import * as core from '@actions/core'
import * as fs from 'fs/promises'
import { DotnetManager } from '../dotnet-manager/DotnetManager.js'
import { Inputs } from '../utils/Inputs.js'
import { GitManager } from '../git-manager/GitManager.js'
import { Timer } from '../utils/Timer.js'

export async function runPublish(): Promise<void> {
  const inputs = new Inputs()
  const dotnet = new DotnetManager(inputs.dotnetRoot, inputs.useGlobalDotnetEf)
  const git = new GitManager()

  console.log('Preparing to publish binaries...')

  // Wait for 5 seconds
  core.info('Waiting for 5 seconds before pulling the latest changes...')
  await Timer.wait(5000)

  // Pull the latest changes
  core.info('Pulling the latest changes from the repository...')
  await git.repo.pull('.', process.env['GITHUB_REF_NAME'])

  const publishDirs = [
    { platform: 'Linux', path: './publish/linux', runtime: 'linux-x64' },
    { platform: 'Windows', path: './publish/windows', runtime: 'win-x64' },
    { platform: 'macOS', path: './publish/macos', runtime: 'osx-x64' }
  ]

  for (const dir of publishDirs) {
    if (
      (dir.platform === 'Linux' && inputs.publishLinux) ||
      (dir.platform === 'Windows' && inputs.publishWindows) ||
      (dir.platform === 'macOS' && inputs.publishMac)
    ) {
      core.info(`Cleaning old publish directory for ${dir.platform}...`)
      await fs.rm(dir.path, { recursive: true, force: true })

      core.info(`Publishing .NET binaries for ${dir.platform}...`)
      await dotnet.projects.publish('Release', dir.path, [
        '--self-contained',
        '--runtime',
        dir.runtime
      ])
    }
  }

  console.log('Publishing completed.')

  // Extract version from .csproj
  const csprojPath = await dotnet.csproj.findCsproj(
    inputs.csprojDepth,
    inputs.csprojName
  )
  const csprojContent = await dotnet.csproj.readCsproj(csprojPath)
  const version = dotnet.csproj.extractVersion(csprojContent)

  // Commit and push changes
  const commitMessage = `Publish binaries for platforms with version ${version}`
  await git.repo.commitAndPush('.', commitMessage)
  core.info(`Changes pushed with commit message: "${commitMessage}"`)
}
