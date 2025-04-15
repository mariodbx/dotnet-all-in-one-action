/**
 * Interface for GitHub Action inputs.
 *
 * @property homeDirectory - Home directory for the action.
 * @property dotnetRoot - Path to the .NET root directory.
 * @property useGlobalDotnetEf - Whether to use the global dotnet-ef CLI.
 * @property runMigrations - Whether to run migrations.
 * @property migrationsFolder - Path to the migrations folder.
 * @property envName - Environment name for migrations.
 * @property onFailedRollbackMigrations - Whether to rollback migrations if tests fail.
 * @property runTests - Whether to run tests.
 * @property testsEnvName - Environment name for tests.
 * @property runTestsMigrations - Whether to run tests migrations.
 * @property testMigrationsFolder - Path to the test migrations folder.
 * @property testFolder - Path to the test folder.
 * @property testOutputFolder - Path to the test output folder.
 * @property uploadTestsResults - Whether to upload tests results.
 * @property testFormat - Format for test results.
 * @property rollbackMigrationsOnTestFailed - Whether to rollback migrations if tests fail.
 * @property runVersioning - Whether to run the versioning step.
 * @property csprojDepth - Maximum depth for locating the .csproj file.
 * @property csprojName - Name pattern for the .csproj file.
 * @property useCommitMessage - Whether to use the commit message to extract the version.
 * @property commitUser - Username for commits.
 * @property commitEmail - Email for commits.
 * @property commitMessagePrefix - Prefix for commit messages.
 * @property runPushToRegistry - Whether to push images to the registry.
 * @property dockerComposeFiles - Comma-separated list of Docker Compose files.
 * @property images - Comma-separated list of image repositories.
 * @property dockerfiles - Comma-separated list of Dockerfile paths.
 * @property dockerfileImages - Comma-separated list of image names corresponding to each Dockerfile.
 * @property dockerfileContexts - Comma-separated list of build contexts for each Dockerfile.
 * @property registryType - Type of container registry.
 * @property pushWithVersion - Whether to push images tagged with the version.
 * @property pushWithLatest - Whether to push images tagged as latest.
 * @property runRelease - Whether to run the release step.
 * @property runChangelog - Whether to run the changelog step.
 * @property majorKeywords - Keywords for major version bumps.
 * @property minorKeywords - Keywords for minor version bumps.
 * @property patchKeywords - Keywords for patch version bumps.
 * @property hotfixKeywords - Keywords for hotfix version bumps.
 * @property addedKeywords - Keywords for added features.
 * @property devKeywords - Keywords for development or experimental features.
 */
export interface ActionInputs {
  // General
  homeDirectory: string
  dotnetRoot: string
  useGlobalDotnetEf: boolean

  // Migrations
  runMigrations: boolean
  migrationsFolder: string
  envName: string
  onFailedRollbackMigrations: boolean

  // Tests
  runTests: boolean
  testsEnvName: string
  runTestsMigrations: boolean
  testMigrationsFolder: string
  testFolder: string
  uploadTestsResults: boolean
  testOutputFolder: string
  testFormat: string
  rollbackMigrationsOnTestFailed: boolean

  // Versioning
  runVersioning: boolean
  csprojDepth: number
  csprojName: string
  useCommitMessage: boolean
  commitUser: string
  commitEmail: string
  commitMessagePrefix: string

  // Docker
  runPushToRegistry: boolean
  dockerComposeFiles: string
  images: string
  dockerfiles: string
  dockerfileImages: string
  dockerfileContexts: string
  registryType: string
  pushWithVersion: boolean
  pushWithLatest: boolean

  // Release
  runRelease: boolean

  // Changelog
  runChangelog: boolean
  majorKeywords: string
  minorKeywords: string
  patchKeywords: string
  hotfixKeywords: string
  addedKeywords: string
  devKeywords: string
}

import * as core from '@actions/core'

/**
 * Retrieves an input value from the GitHub Actions workflow or returns a default value.
 *
 * @param {string} name - The name of the input to retrieve.
 * @param {string} defaultValue - The default value to return if the input is not provided.
 * @returns {string} The input value if provided, otherwise the default value.
 * @throws {Error} If the input retrieval fails unexpectedly.
 *
 * @example
 * // Get an input value or use a default
 * const value: string = getInputOrDefault('my-input', 'default-value');
 * console.log(value);
 *
 * @remarks
 * This function retrieves inputs using `@actions/core.getInput`. Ensure that the input name matches
 * the one defined in the GitHub Actions workflow YAML file. If the input is not provided, the
 * `defaultValue` will be returned.
 */
export function getInputOrDefault(name: string, defaultValue: string): string {
  return core.getInput(name) || defaultValue
}

/**
 * Retrieves a boolean input value from the GitHub Actions workflow or returns a default value.
 *
 * @param {string} name - The name of the input to retrieve.
 * @param {boolean} defaultValue - The default boolean value to return if the input is not provided.
 * @returns {boolean} The boolean input value if provided, otherwise the default value.
 * @throws {Error} If the input retrieval fails unexpectedly.
 *
 * @example
 * // Get a boolean input value or use a default
 * const isEnabled: boolean = getInputOrDefaultBoolean('enable-feature', false);
 * console.log(isEnabled);
 *
 * @remarks
 * This function interprets the input value as a boolean. The input is considered `true` if it is
 * provided and equals (case-insensitively) the string `'true'`. Otherwise, it is considered `false`.
 */
export function getInputOrDefaultBoolean(
  name: string,
  defaultValue: boolean
): boolean {
  const value = core.getInput(name)
  return value ? value.toLowerCase() === 'true' : defaultValue
}

/**
 * Reads and parses GitHub Action inputs from the environment.
 *
 * @returns {ActionInputs} An object that conforms to the ActionInputs interface.
 * @throws {Error} If any required input is missing or invalid.
 *
 * @example
 * // Retrieve all inputs
 * const inputs: ActionInputs = getInputs();
 * console.log(inputs);
 *
 * @remarks
 * This function aggregates all inputs defined in the `ActionInputs` interface. It uses helper
 * functions to retrieve and parse individual inputs. Ensure that the input names match those
 * defined in the GitHub Actions workflow YAML file.
 */
export function getInputs(): ActionInputs {
  return {
    // General
    homeDirectory: getInputOrDefault('home_directory', '/home/node'),
    dotnetRoot: getInputOrDefault('dotnet_root', '/usr/bin/dotnet'),
    useGlobalDotnetEf: getInputOrDefaultBoolean('use_global_dotnet_ef', false),

    // Migrations
    runMigrations: getInputOrDefaultBoolean('run_migrations', false),
    migrationsFolder: getInputOrDefault('migrations_folder', ''),
    envName: getInputOrDefault('migrations_env_name', 'Development'),
    onFailedRollbackMigrations: getInputOrDefaultBoolean(
      'on_failed_rollback_migrations',
      false
    ),

    // Tests
    runTests: getInputOrDefaultBoolean('run_tests', false),
    testsEnvName: getInputOrDefault('tests_env_name', 'Test'),
    runTestsMigrations: getInputOrDefaultBoolean('run_tests_migrations', true),
    testMigrationsFolder: getInputOrDefault('test_migrations_folder', ''),
    testFolder: getInputOrDefault('test_folder', ''),
    uploadTestsResults: getInputOrDefaultBoolean('upload_tests_results', false),
    testOutputFolder: getInputOrDefault('test_output_folder', 'TestResults'),
    testFormat: getInputOrDefault('test_format', 'html'),
    rollbackMigrationsOnTestFailed: getInputOrDefaultBoolean(
      'rollback_migrations_on_test_failed',
      false
    ),

    // Versioning
    runVersioning: getInputOrDefaultBoolean('run_versioning', false),
    csprojDepth: parseInt(getInputOrDefault('csproj_depth', '1'), 10),
    csprojName: getInputOrDefault('csproj_name', '*.csproj'),
    useCommitMessage: getInputOrDefaultBoolean('use_commit_message', false),
    commitUser: getInputOrDefault('commit_user', 'github-actions'),
    commitEmail: getInputOrDefault(
      'commit_email',
      'github-actions@users.noreply.github.com'
    ),
    commitMessagePrefix: getInputOrDefault(
      'commit_message_prefix',
      'New Version: bump version to '
    ),

    // Docker
    runPushToRegistry: getInputOrDefaultBoolean('run_push_to_registry', false),
    dockerComposeFiles: getInputOrDefault('docker_compose_files', ''),
    images: getInputOrDefault('images', ''),
    dockerfiles: getInputOrDefault('dockerfiles', ''),
    dockerfileImages: getInputOrDefault('dockerfile_images', ''),
    dockerfileContexts: getInputOrDefault('dockerfile_contexts', '.'),
    registryType: getInputOrDefault('registry_type', 'GHCR'),
    pushWithVersion: getInputOrDefaultBoolean('push_with_version', true),
    pushWithLatest: getInputOrDefaultBoolean('push_with_latest', true),

    // Release
    runRelease: getInputOrDefaultBoolean('run_release', false),

    // Changelog
    runChangelog: getInputOrDefaultBoolean('run_changelog', false),

    majorKeywords: getInputOrDefault('major_keywords', 'breaking, overhaul'),
    minorKeywords: getInputOrDefault('minor_keywords', 'feature, enhancement'),
    patchKeywords: getInputOrDefault(
      'patch_keywords',
      'bug-fix, hotfix, patch'
    ),
    hotfixKeywords: getInputOrDefault('hotfix_keywords', 'urgent, hotfix'),
    addedKeywords: getInputOrDefault('added_keywords', 'added, new'),
    devKeywords: getInputOrDefault('dev_keywords', 'dev, experiment')
  }
}
