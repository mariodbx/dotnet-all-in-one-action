import * as core from '@actions/core';
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
export function getInputOrDefault(name, defaultValue) {
    return core.getInput(name) || defaultValue;
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
export function getInputOrDefaultBoolean(name, defaultValue) {
    const value = core.getInput(name);
    return value ? value.toLowerCase() === 'true' : defaultValue;
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
export function getInputs() {
    return {
        showFullOutput: getInputOrDefaultBoolean('show_full_output', true),
        runMigrations: getInputOrDefaultBoolean('run_migrations', true),
        migrationsFolder: getInputOrDefault('migrations_folder', './sample-project/sample-project.MVC'),
        envName: getInputOrDefault('env_name', 'Test'),
        dotnetRoot: getInputOrDefault('dotnet_root', ''),
        useGlobalDotnetEf: getInputOrDefaultBoolean('use_global_dotnet_ef', false),
        onFailedRollbackMigrations: getInputOrDefaultBoolean('on_failed_rollback_migrations', false),
        runTests: getInputOrDefaultBoolean('run_tests', true),
        testFolder: getInputOrDefault('test_folder', './sample-project/sample-project.Tests'),
        testOutputFolder: getInputOrDefault('test_output_folder', 'TestResults'),
        testFormat: getInputOrDefault('test_format', 'trx'),
        runVersioning: getInputOrDefaultBoolean('run_versioning', true),
        csprojDepth: parseInt(getInputOrDefault('csproj_depth', '3'), 10),
        csprojName: getInputOrDefault('csproj_name', 'sample-project.MVC.csproj'),
        useCommitMessage: getInputOrDefaultBoolean('use_commit_message', false),
        runPushToRegistry: getInputOrDefaultBoolean('run_push_to_registry', true),
        dockerComposeFiles: getInputOrDefault('docker_compose_files', ''),
        images: getInputOrDefault('images', ''),
        dockerfiles: getInputOrDefault('dockerfiles', './sample-project/sample-project.MVC/Dockerfile'),
        dockerfileImages: getInputOrDefault('dockerfile_images', 'sample-project.mvc'),
        dockerfileContexts: getInputOrDefault('dockerfile_contexts', '.'),
        registryType: getInputOrDefault('registry_type', 'GHCR'),
        pushWithVersion: getInputOrDefaultBoolean('push_with_version', true),
        pushWithLatest: getInputOrDefaultBoolean('push_with_latest', true),
        runReleaseAndChangelog: getInputOrDefaultBoolean('run_release_and_changelog', true),
        commitUser: getInputOrDefault('commit_user', 'github-actions'),
        commitEmail: getInputOrDefault('commit_email', 'github-actions@users.noreply.github.com'),
        commitMessagePrefix: getInputOrDefault('commit_message_prefix', 'New Version: bump version to '),
        majorKeywords: getInputOrDefault('major_keywords', 'breaking, overhaul'),
        minorKeywords: getInputOrDefault('minor_keywords', 'feature, enhancement'),
        patchKeywords: getInputOrDefault('patch_keywords', 'bug-fix, hotfix, patch'),
        hotfixKeywords: getInputOrDefault('hotfix_keywords', 'urgent, hotfix'),
        addedKeywords: getInputOrDefault('added_keywords', 'added, new'),
        devKeywords: getInputOrDefault('dev_keywords', 'dev, experiment'),
        homeDirectory: getInputOrDefault('home_directory', '/home/node'),
        rollbackMigrationsOnTestFailed: getInputOrDefaultBoolean('rollback_migrations_on_test_failed', false),
        runTestsMigrations: getInputOrDefaultBoolean('run_tests_migrations', true),
        testMigrationsFolder: getInputOrDefault('test_migrations_folder', 'sa'),
        currentVersion: getInputOrDefault('current_version', ''),
        newVersion: getInputOrDefault('new_version', ''),
        bumpType: getInputOrDefault('bump_type', ''),
        skipRelease: getInputOrDefaultBoolean('skip_release', false),
        dockerPushStatus: getInputOrDefault('docker_push_status', ''),
        changelog: getInputOrDefault('changelog', ''),
        releaseStatus: getInputOrDefault('release_status', ''),
        skip: getInputOrDefaultBoolean('skip', false)
    };
}
