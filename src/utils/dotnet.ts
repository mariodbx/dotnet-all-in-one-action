import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Interface defining utility methods for .NET operations.
 */
export interface IDotnetUtils {
  installDotnetEfLocally(): Promise<void>
  publishDotnetProject(
    configuration: string,
    outputDir: string,
    additionalFlags?: string[]
  ): Promise<void>
}

/**
 * Class implementing .NET utility methods.
 */
export class DotnetUtils implements IDotnetUtils {
  /**
   * Installs the dotnet-ef tool locally if it is not already installed.
   *
   * This function creates or overrides the tool manifest and installs the `dotnet-ef` tool locally.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is complete.
   * @throws {Error} Throws an error if the installation fails.
   *
   * @example
   * // Install dotnet-ef locally
   * const utils = new DotnetUtils();
   * await utils.installDotnetEfLocally();
   */
  async installDotnetEfLocally(): Promise<void> {
    core.info('Installing dotnet-ef tool locally via tool manifest...')
    const toolManifestArgs: string[] = ['new', 'tool-manifest', '--force']
    const installEfArgs: string[] = ['tool', 'install', '--local', 'dotnet-ef']

    try {
      // Create or override the tool manifest
      await exec.exec('dotnet', toolManifestArgs)
      core.info('Tool manifest created or updated.')

      // Install the dotnet-ef tool locally
      await exec.exec('dotnet', installEfArgs)
      core.info('dotnet-ef tool installed locally.')
    } catch (error) {
      core.error('Failed to install dotnet-ef tool locally.')
      throw new Error(`Error during dotnet-ef installation: ${error}`)
    }
  }

  /**
   * Publishes a .NET project with the specified configuration and additional flags.
   *
   * @param {string} configuration - The build configuration (e.g., 'Release', 'Debug').
   * @param {string} outputDir - The output directory for the published files.
   * @param {string[]} additionalFlags - Additional flags for the publish command (e.g., '--self-contained', '--runtime linux-x64').
   * @returns {Promise<void>} A promise that resolves when the publish is complete.
   * @throws {Error} Throws an error if the publish process fails.
   *
   * @example
   * // Publish a project in Release configuration with self-contained Linux runtime
   * const utils = new DotnetUtils();
   * await utils.publishDotnetProject('Release', './publish/release', ['--self-contained', '--runtime', 'linux-x64']);
   *
   * // Publish a project in Debug configuration without additional flags
   * await utils.publishDotnetProject('Debug', './publish/debug', []);
   */
  async publishDotnetProject(
    configuration: string,
    outputDir: string,
    additionalFlags: string[] = []
  ): Promise<void> {
    core.info(
      `Publishing .NET project with configuration: ${configuration} and flags: ${additionalFlags.join(' ')}...`
    )
    const publishArgs: string[] = [
      'publish',
      '-c',
      configuration,
      '-o',
      outputDir,
      ...additionalFlags
    ]

    try {
      // Execute the dotnet publish command
      await exec.exec('dotnet', publishArgs)
      core.info(`.NET project published successfully to ${outputDir}.`)
    } catch (error) {
      core.error('Failed to publish .NET project.')
      throw new Error(`Error during .NET project publish: ${error}`)
    }
  }
}
