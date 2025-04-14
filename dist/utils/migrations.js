import * as core from '@actions/core';
import { runCommand } from './command.js';
/**
 * Executes EF Core migrations.
 *
 * @param {boolean} getExecOutput - If true, captures the output using runCommand; otherwise, streams output.
 * @param {string} envName - The ASP.NET Core environment name (e.g., 'Development', 'Production').
 * @param {string} home - The home directory path to set for the environment.
 * @param {string} migrationsFolder - The folder containing the EF Core migrations.
 * @param {string} dotnetRoot - The path to the dotnet executable.
 * @param {boolean} useGlobalDotnetEf - If true, the global dotnet-ef installation is used; if false, the tool is installed locally.
 * @returns {Promise<string>} The name of the last applied migration, or an empty string if no migrations were applied.
 * @throws {Error} If the migration command fails.
 * @remarks
 * - Ensure the `dotnet-ef` CLI tool is installed and accessible in the environment.
 * - The `migrationsFolder` must contain valid EF Core migration files.
 * - This function applies only the last pending migration if any exist.
 * @example
 * ```typescript
 * const lastMigration = await processMigrations(
 *   true,
 *   'Development',
 *   '/home/user',
 *   './migrations',
 *   '/usr/local/share/dotnet',
 *   false
 * );
 * console.log(`Last applied migration: ${lastMigration}`);
 * ```
 */
export async function processMigrations(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
    let migrationOutput = '';
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName || 'Test'
    };
    core.info(`Using environment: '${baseEnv.ASPNETCORE_ENVIRONMENT}'`);
    const migrationOptions = { cwd: migrationsFolder, env: baseEnv };
    const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : dotnetRoot;
    let efArgs = useGlobalDotnetEf
        ? ['migrations', 'list']
        : ['tool', 'run', 'dotnet-ef', 'migrations', 'list'];
    migrationOutput = await runCommand(efCmd, efArgs, migrationOptions, getExecOutput);
    core.info(migrationOutput);
    const pendingMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.trim() && !line.includes('[applied]'));
    let lastMigration = '';
    if (pendingMigrations.length > 0) {
        lastMigration = pendingMigrations[pendingMigrations.length - 1].trim();
        core.info(`Applying last pending migration: ${lastMigration}`);
        efArgs = useGlobalDotnetEf
            ? ['database', 'update']
            : ['tool', 'run', 'dotnet-ef', 'database', 'update'];
        await runCommand(efCmd, efArgs, migrationOptions, getExecOutput);
        core.info('Migrations applied successfully.');
    }
    else {
        core.info('No pending migrations detected.');
    }
    return lastMigration;
}
/**
 * Gets the last applied migration in the database.
 *
 * @param {boolean} getExecOutput - If true, captures command output using runCommand; otherwise, streams output.
 * @param {string} envName - The ASP.NET Core environment name.
 * @param {string} home - Home directory to set for environment variables.
 * @param {string} migrationsFolder - The folder that contains the migration files.
 * @param {string} dotnetRoot - Path to the dotnet executable.
 * @param {boolean} useGlobalDotnetEf - If true, use the global dotnet-ef; otherwise, run via the local tool.
 * @returns {Promise<string>} The name of the last applied migration, or '0' if none is found.
 * @throws {Error} If the command to list migrations fails.
 * @remarks
 * - This function identifies the last migration marked as `[applied]` in the output.
 * - Returns '0' if no migrations have been applied.
 * @example
 * ```typescript
 * const lastApplied = await getCurrentAppliedMigration(
 *   true,
 *   'Production',
 *   '/home/user',
 *   './migrations',
 *   '/usr/local/share/dotnet',
 *   true
 * );
 * console.log(`Last applied migration: ${lastApplied}`);
 * ```
 */
export async function getCurrentAppliedMigration(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName
    };
    const migrationOptions = { cwd: migrationsFolder, env: baseEnv };
    const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : dotnetRoot;
    const efArgs = useGlobalDotnetEf
        ? ['migrations', 'list']
        : ['tool', 'run', 'dotnet-ef', 'migrations', 'list'];
    const migrationOutput = await runCommand(efCmd, efArgs, migrationOptions, getExecOutput);
    core.info(`Full migration output:\n${migrationOutput}`);
    const appliedMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.includes('[applied]'))
        .map((line) => line.replace(/\[applied\]/i, '').trim());
    const lastApplied = appliedMigrations.length > 0 ? appliedMigrations.pop() : '0';
    core.info(`Current applied migration: ${lastApplied}`);
    return lastApplied;
}
/**
 * Gets the last non-pending migration.
 *
 * @param {boolean} getExecOutput - If true, uses runCommand to capture output; otherwise, streams output.
 * @param {string} envName - The ASP.NET Core environment name.
 * @param {string} home - Home directory for the environment variables.
 * @param {string} migrationsFolder - Folder where migrations are stored.
 * @param {string} dotnetRoot - Path to the dotnet executable.
 * @param {boolean} useGlobalDotnetEf - If true, use the global dotnet-ef installation; else, run through the local tool.
 * @returns {Promise<string>} The last non-pending migration name, or '0' if none is found.
 * @throws {Error} If the command to list migrations fails.
 * @remarks
 * - This function filters out migrations marked as `(pending)` in the output.
 * - Returns '0' if no non-pending migrations are found.
 * @example
 * ```typescript
 * const lastNonPending = await getLastNonPendingMigration(
 *   false,
 *   'Test',
 *   '/home/user',
 *   './migrations',
 *   '/usr/local/share/dotnet',
 *   false
 * );
 * console.log(`Last non-pending migration: ${lastNonPending}`);
 * ```
 */
export async function getLastNonPendingMigration(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName
    };
    const migrationOptions = { cwd: migrationsFolder, env: baseEnv };
    const efCmd = useGlobalDotnetEf ? 'dotnet-ef' : dotnetRoot;
    const efArgs = useGlobalDotnetEf
        ? ['migrations', 'list']
        : ['tool', 'run', 'dotnet-ef', 'migrations', 'list'];
    const migrationOutput = await runCommand(efCmd, efArgs, migrationOptions, getExecOutput);
    core.info(`Full migration output:\n${migrationOutput}`);
    const nonPendingMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.trim() && !/\(pending\)/i.test(line));
    const lastMigration = nonPendingMigrations.length > 0 ? nonPendingMigrations.pop() : '0';
    core.info(`Last non-pending migration: ${lastMigration}`);
    return lastMigration;
}
/**
 * Rolls back EF Core database migrations.
 *
 * @param {boolean} getExecOutput - If true, uses runCommand to capture the stdout and stderr of the rollback command.
 * @param {string} envName - The ASP.NET Core environment name to use.
 * @param {string} home - The home directory path to set as `HOME` in the execution environment.
 * @param {string} migrationsFolder - The working directory where the migrations should be run.
 * @param {string} dotnetRoot - Path to the local dotnet executable or root directory.
 * @param {boolean} useGlobalDotnetEf - Whether to use a globally installed `dotnet-ef` CLI tool.
 * @param {string} targetMigration - The migration name or ID to which the database should be rolled back.
 * @returns {Promise<void>} Resolves when the rollback is successful.
 * @throws {Error} If the rollback command fails.
 * @remarks
 * - Ensure the target migration exists in the database before attempting a rollback.
 * - This function updates the database schema to match the specified migration.
 * @example
 * ```typescript
 * await rollbackMigrations(
 *   true,
 *   'Development',
 *   '/home/user',
 *   './migrations',
 *   '/usr/local/share/dotnet',
 *   true,
 *   'InitialMigration'
 * );
 * console.log('Rollback completed.');
 * ```
 */
export async function rollbackMigrations(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf, targetMigration) {
    core.info(`Rolling back to migration: ${targetMigration}...`);
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName
    };
    const rollbackArgs = useGlobalDotnetEf
        ? ['database', 'update', targetMigration]
        : ['tool', 'run', 'dotnet-ef', 'database', 'update', targetMigration];
    const execOptions = { cwd: migrationsFolder, env: baseEnv };
    await runCommand(useGlobalDotnetEf ? 'dotnet-ef' : dotnetRoot, rollbackArgs, execOptions, getExecOutput);
    core.info('Rollback completed successfully.');
}
