import * as core from '@actions/core';
/**
 * Class to manage GitHub Action inputs.
 *
 * @remarks
 * This class encapsulates the logic for retrieving and parsing inputs
 * from the GitHub Actions workflow environment.
 */
export class Inputs {
    // General
    homeDirectory;
    dotnetRoot;
    useGlobalDotnetEf;
    // Migrations
    runMigrations;
    migrationsFolder;
    envName;
    onFailedRollbackMigrations;
    // Tests
    runTests;
    testsEnvName;
    runTestsMigrations;
    testMigrationsFolder;
    testFolder;
    uploadTestsResults;
    testOutputFolder;
    testFormat;
    rollbackMigrationsOnTestFailed;
    // Versioning
    version;
    runVersioning;
    csprojDepth;
    csprojName;
    useCommitMessage;
    commitUser;
    commitEmail;
    commitMessagePrefix;
    // Docker
    runPushToRegistry;
    dockerComposeFiles;
    images;
    dockerfiles;
    dockerfileImages;
    dockerfileContexts;
    registryType;
    pushWithVersion;
    pushWithLatest;
    runDockerBuild;
    runDockerPush;
    // Release
    runRelease;
    // Changelog
    includeGhcrPackage;
    includeDotnetBinaries;
    runChangelog;
    majorKeywords;
    minorKeywords;
    patchKeywords;
    hotfixKeywords;
    addedKeywords;
    devKeywords;
    // Publish
    runPublish;
    publishLinux;
    publishWindows;
    publishMac;
    constructor() {
        this.homeDirectory = this.getInputOrDefault('home_directory', '/home/node');
        this.dotnetRoot = this.getInputOrDefault('dotnet_root', '/usr/bin/dotnet');
        this.useGlobalDotnetEf = this.getInputOrDefaultBoolean('use_global_dotnet_ef', false);
        // Migrations
        this.runMigrations = this.getInputOrDefaultBoolean('run_migrations', false);
        this.migrationsFolder = this.getInputOrDefault('migrations_folder', '');
        this.envName = this.getInputOrDefault('migrations_env_name', 'Development');
        this.onFailedRollbackMigrations = this.getInputOrDefaultBoolean('on_failed_rollback_migrations', false);
        // Tests
        this.runTests = this.getInputOrDefaultBoolean('run_tests', false);
        this.testsEnvName = this.getInputOrDefault('tests_env_name', 'Test');
        this.runTestsMigrations = this.getInputOrDefaultBoolean('run_tests_migrations', true);
        this.testMigrationsFolder = this.getInputOrDefault('test_migrations_folder', '');
        this.testFolder = this.getInputOrDefault('test_folder', '');
        this.uploadTestsResults = this.getInputOrDefaultBoolean('upload_tests_results', false);
        this.testOutputFolder = this.getInputOrDefault('test_output_folder', 'TestResults');
        this.testFormat = this.getInputOrDefault('test_format', 'html');
        this.rollbackMigrationsOnTestFailed = this.getInputOrDefaultBoolean('rollback_migrations_on_test_failed', false);
        // Versioning
        this.version = this.getInputOrDefault('version', '0.0.0');
        this.runVersioning = this.getInputOrDefaultBoolean('run_versioning', false);
        this.csprojDepth = parseInt(this.getInputOrDefault('csproj_depth', '1'), 10);
        this.csprojName = this.getInputOrDefault('csproj_name', '*.csproj');
        this.useCommitMessage = this.getInputOrDefaultBoolean('use_commit_message', false);
        this.commitUser = this.getInputOrDefault('commit_user', 'github-actions');
        this.commitEmail = this.getInputOrDefault('commit_email', 'github-actions@users.noreply.github.com');
        this.commitMessagePrefix = this.getInputOrDefault('commit_message_prefix', 'New Version: bump version to ');
        // Docker
        this.runPushToRegistry = this.getInputOrDefaultBoolean('run_push_to_registry', false);
        this.dockerComposeFiles = this.getInputOrDefault('docker_compose_files', '');
        this.images = this.getInputOrDefault('images', '');
        this.dockerfiles = this.getInputOrDefault('dockerfiles', '');
        this.dockerfileImages = this.getInputOrDefault('dockerfile_images', '');
        this.dockerfileContexts = this.getInputOrDefault('dockerfile_contexts', '.');
        this.registryType = this.getInputOrDefault('registry_type', 'GHCR');
        this.pushWithVersion = this.getInputOrDefaultBoolean('push_with_version', true);
        this.pushWithLatest = this.getInputOrDefaultBoolean('push_with_latest', true);
        this.runDockerBuild = this.getInputOrDefaultBoolean('run_docker_build', false);
        this.runDockerPush = this.getInputOrDefaultBoolean('run_docker_push', false);
        // Release
        this.runRelease = this.getInputOrDefaultBoolean('run_release', false);
        // Changelog
        this.includeGhcrPackage = this.getInputOrDefaultBoolean('include_ghcr_package', false);
        this.includeDotnetBinaries = core.getBooleanInput('include_dotnet_binaries');
        this.runChangelog = this.getInputOrDefaultBoolean('run_changelog', false);
        this.majorKeywords = this.getInputOrDefault('major_keywords', 'breaking, overhaul');
        this.minorKeywords = this.getInputOrDefault('minor_keywords', 'feature, enhancement');
        this.patchKeywords = this.getInputOrDefault('patch_keywords', 'bug-fix, hotfix, patch');
        this.hotfixKeywords = this.getInputOrDefault('hotfix_keywords', 'urgent, hotfix');
        this.addedKeywords = this.getInputOrDefault('added_keywords', 'added, new');
        this.devKeywords = this.getInputOrDefault('dev_keywords', 'dev, experiment');
        // Publish
        this.runPublish = core.getBooleanInput('run_publish');
        this.publishLinux = core.getBooleanInput('publish_linux');
        this.publishWindows = core.getBooleanInput('publish_windows');
        this.publishMac = core.getBooleanInput('publish_mac');
    }
    getInputOrDefault(name, defaultValue) {
        return core.getInput(name) || defaultValue;
    }
    getInputOrDefaultBoolean(name, defaultValue) {
        const value = core.getInput(name);
        return value ? value.toLowerCase() === 'true' : defaultValue;
    }
}
