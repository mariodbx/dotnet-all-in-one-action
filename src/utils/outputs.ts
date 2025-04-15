import * as core from '@actions/core'

/**
 * Interface for GitHub Action outputs.
 *
 * @property lastMigration - The last applied database migration.
 * @property startTime - The time when the workflow started.
 * @property endTime - The time when the workflow finished.
 * @property version - The extracted version from .csproj or commit message.
 * @property currentVersion - The current version before the bump.
 * @property newVersion - The new version after the bump.
 * @property bumpType - The type of version bump (major, minor, patch).
 * @property skipRelease - Indicates if the release should be skipped.
 * @property dockerPushStatus - Status of Docker image push (success/failure).
 * @property changelog - The generated changelog for the release.
 * @property releaseStatus - Status of the release creation (success/failure).
 * @property skip - Flag indicating whether to skip the release process.
 * @property testResultsUploaded - Indicates if test results were uploaded.
 * @property testOutputFolder - The folder where test results are stored.
 * @property uploadTestsResults - Indicates if test results should be uploaded.
 */
export interface ActionOutputs {
  lastMigration?: string
  startTime?: string
  endTime?: string
  version?: string
  currentVersion?: string
  newVersion?: string
  bumpType?: string
  skipRelease?: boolean
  dockerPushStatus?: string
  changelog?: string
  releaseStatus?: string
  skip?: boolean
  testResultsUploaded?: boolean
  testOutputFolder?: string
  uploadTestsResults?: boolean
}

/**
 * Sets outputs for the GitHub Action.
 *
 * @param {ActionOutputs} outputs - An object containing the outputs to set.
 *
 * @example
* // Set outputs for the action
* // Set outputs for the action
 * // Set outputs for the action
 * setOutputs({
 *   lastMigration: '20231001_AddUsersTable',
 *   startTime: '2023-10-01T10:00:00Z',
 *   endTime: '2023-10-01T10:30:00Z',
 *   version: '1.2.3',
 *   currentVersion: '1.2.2',
 *   newVersion: '1.2.3',
 *   bumpType: 'patch',
 *   skipRelease: false,
 *   dockerPushStatus: 'success',
 *   changelog: 'Added new features and fixed bugs.',
 *   releaseStatus: 'success',
 *   skip: false
 * }*
 * @remarks
 * This function uses `@actions/core.setOutput` to set outputs for the GitHub Action.
 * Ensure that the output names match those defined in the `action.yml` file.
)*
 * @remarks
 * This function uses `@actions/core.setOutput` to set outputs for the GitHub Action.
 * Ensure that the output names match those defined in the `action.yml` file.

 *
 * @remarks
 * This function uses `@actions/core.setOutput` to set outputs for the GitHub Action.
 * Ensure that the output names match those defined in the `action.yml` file.
 */
export function setOutputs(outputs: ActionOutputs): void {
  Object.entries(outputs).forEach(([key, value]) => {
    if (value !== undefined) {
      core.setOutput(key, value)
    }
  })
  // Ensure startTime and endTime are explicitly logged
  if (outputs.startTime) core.info(`Start Time: ${outputs.startTime}`)
  if (outputs.endTime) core.info(`End Time: ${outputs.endTime}`)
}

/**
 * Retrieves outputs from the GitHub Actions workflow environment.
 *
 * @returns {ActionOutputs} An object that conforms to the ActionOutputs interface.
 *
 * @example
 * // Retrieve all outputs
 * const outputs: ActionOutputs = getOutputs();
 * console.log(outputs);
 *
 * @remarks
 * This function retrieves outputs using `@actions/core.getInput`. Ensure that the output names
 * match those defined in the GitHub Actions workflow YAML file.
 */
export function getOutputs(): ActionOutputs {
  return {
    lastMigration: core.getInput('last_migration'),
    startTime: core.getInput('start_time'),
    endTime: core.getInput('end_time'),
    version: core.getInput('version'),
    currentVersion: core.getInput('current_version'),
    newVersion: core.getInput('new_version'),
    bumpType: core.getInput('bump_type'),
    skipRelease: core.getBooleanInput('skip_release'),
    dockerPushStatus: core.getInput('docker_push_status'),
    changelog: core.getInput('changelog'),
    releaseStatus: core.getInput('release_status'),
    skip: core.getBooleanInput('skip'),
    testResultsUploaded: core.getBooleanInput('test_results_uploaded'),
    testOutputFolder: core.getInput('test_output_folder'),
    uploadTestsResults: core.getBooleanInput('upload_tests_results')
  }
}
