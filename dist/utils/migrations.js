import * as core from '@actions/core';
import * as exec from '@actions/exec';
/**
 * Executes EF Core migrations.
 *
 * This function checks for pending migrations and applies them if necessary.
 * It supports either a globally installed dotnet-ef tool or a local installation via a tool manifest.
 *
 * @param getExecOutput - If true, captures the output using exec.getExecOutput; otherwise, streams output using exec.exec.
 * @param envName - The ASP.NET Core environment name (e.g., 'Development', 'Production').
 * @param home - The home directory path to set for the environment (overrides process.env['HOME'] if not already set).
 * @param migrationsFolder - The folder containing the EF Core migrations.
 * @param dotnetRoot - The path to the dotnet executable.
 * @param useGlobalDotnetEf - If true, the global dotnet-ef installation is used; if false, the tool is installed locally.
 *
 * @returns A Promise that resolves with the name of the last applied migration, or an empty string if no migrations were applied.
 *
 * @example
 * ```ts
 * await processMigrations(
 *   true,                    // Capture output mode
 *   'Development',           // ASPNETCORE_ENVIRONMENT value
 *   '/home/user',            // Home directory (will override process.env.HOME if necessary)
 *   './src/Migrations',      // Folder containing migrations
 *   '/usr/local/share/dotnet', // Path to dotnet executable
 *   false                    // Use local installation of dotnet-ef
 * )
 * ```
 */
export async function processMigrations(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
    let migrationOutput = '';
    // Build the base environment for executing dotnet commands.
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName
    };
    // Set a default environment if none was provided.
    if (!envName) {
        core.info("Environment not provided. Defaulting to 'Test' environment...");
        baseEnv.ASPNETCORE_ENVIRONMENT = 'Test';
    }
    else {
        core.info(`Using provided environment: '${envName}'`);
    }
    // Set up options for executing the migration command.
    const migrationOptions = {
        cwd: migrationsFolder,
        env: baseEnv,
        listeners: {
            stdout: (data) => {
                migrationOutput += data.toString();
            }
        }
    };
    let efCmd;
    let efArgs;
    // Determine how to run dotnet-ef:
    // If using the global tool, execute it directly.
    // Otherwise, install and run it locally via the tool manifest.
    if (useGlobalDotnetEf) {
        efCmd = 'dotnet-ef';
        efArgs = ['migrations', 'list'];
    }
    else {
        core.info('Installing dotnet-ef tool locally via tool manifest...');
        const toolManifestArgs = ['new', 'tool-manifest', '--force'];
        const installEfArgs = ['tool', 'install', '--local', 'dotnet-ef'];
        if (getExecOutput) {
            // Create or override the tool manifest and install dotnet-ef.
            await exec.getExecOutput(dotnetRoot, toolManifestArgs, {
                cwd: migrationsFolder,
                env: baseEnv
            });
            await exec.getExecOutput(dotnetRoot, installEfArgs, {
                cwd: migrationsFolder,
                env: baseEnv
            });
        }
        else {
            await exec.exec(dotnetRoot, toolManifestArgs, {
                cwd: migrationsFolder,
                env: baseEnv
            });
            await exec.exec(dotnetRoot, installEfArgs, {
                cwd: migrationsFolder,
                env: baseEnv
            });
        }
        core.info('dotnet-ef installed locally via tool manifest.');
        // Build the command to run dotnet-ef locally using the manifest.
        efCmd = dotnetRoot;
        efArgs = ['tool', 'run', 'dotnet-ef', 'migrations', 'list'];
    }
    // List migrations to check for pending migrations.
    core.info(`Listing migrations in folder: ${migrationsFolder}...`);
    if (getExecOutput) {
        const result = await exec.getExecOutput(efCmd, efArgs, migrationOptions);
        core.info(result.stdout);
        migrationOutput += result.stdout;
    }
    else {
        await exec.exec(efCmd, efArgs, migrationOptions);
    }
    core.info(migrationOutput);
    // Parse the output to detect pending migrations (those not marked as applied)
    const pendingMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.trim() && !line.includes('[applied]'));
    let lastMigration = '';
    // If pending migrations exist, apply them.
    if (pendingMigrations.length > 0) {
        core.info('Pending migrations detected. Applying migrations...');
        lastMigration = pendingMigrations[pendingMigrations.length - 1].trim();
        core.info(`Last pending migration to apply: ${lastMigration}`);
        if (useGlobalDotnetEf) {
            efCmd = 'dotnet-ef';
            efArgs = ['database', 'update'];
        }
        else {
            efCmd = dotnetRoot;
            efArgs = ['tool', 'run', 'dotnet-ef', 'database', 'update'];
        }
        // Run the migration update command.
        if (getExecOutput) {
            const updateResult = await exec.getExecOutput(efCmd, efArgs, {
                cwd: migrationsFolder,
                env: baseEnv
            });
            core.info(updateResult.stdout);
            if (updateResult.exitCode !== 0) {
                throw new Error(`Migration update failed with exit code ${updateResult.exitCode}`);
            }
        }
        else {
            const exitCode = await exec.exec(efCmd, efArgs, {
                cwd: migrationsFolder,
                env: baseEnv
            });
            if (exitCode !== 0) {
                throw new Error(`Migration update failed with exit code ${exitCode}`);
            }
        }
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
 * This function executes the "dotnet-ef migrations list" command to retrieve a list of migrations,
 * and then filters out the migrations that are marked as applied (typically with "[applied]").
 *
 * @param getExecOutput - If true, captures command output using exec.getExecOutput; otherwise, streams output.
 * @param envName - The ASPNETCORE_ENVIRONMENT name.
 * @param home - Home directory to set for environment variables (overrides process.env['HOME'] if not set).
 * @param migrationsFolder - The folder that contains the migration files.
 * @param dotnetRoot - Path to the dotnet executable.
 * @param useGlobalDotnetEf - If true, use the global dotnet-ef; otherwise, run via the local tool.
 *
 * @returns A Promise that resolves with the name of the last applied migration, or '0' if none is found.
 *
 * @example
 * ```ts
 * const lastApplied = await getCurrentAppliedMigration(
 *   true,                     // Capture output mode
 *   'Production',             // Environment name
 *   '/home/user',             // Home directory
 *   './src/Migrations',       // Migrations folder
 *   '/usr/local/share/dotnet', // Path to dotnet executable
 *   true                      // Use global dotnet-ef
 * )
 * console.log(`Last applied migration: ${lastApplied}`)
 * ```
 */
export async function getCurrentAppliedMigration(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
    let migrationOutput = '';
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName
    };
    const migrationOptions = {
        cwd: migrationsFolder,
        env: baseEnv,
        listeners: {
            stdout: (data) => {
                migrationOutput += data.toString();
            }
        }
    };
    let efCmd;
    let efArgs;
    // Choose the correct command based on whether global or local dotnet-ef should be used.
    if (useGlobalDotnetEf) {
        efCmd = 'dotnet-ef';
        efArgs = ['migrations', 'list'];
    }
    else {
        efCmd = dotnetRoot;
        efArgs = ['tool', 'run', 'dotnet-ef', 'migrations', 'list'];
    }
    // Execute command and capture migration listing.
    if (getExecOutput) {
        const result = await exec.getExecOutput(efCmd, efArgs, migrationOptions);
        migrationOutput += result.stdout;
    }
    else {
        await exec.exec(efCmd, efArgs, migrationOptions);
    }
    core.info(`Full migration output:\n${migrationOutput}`);
    // Filter the applied migrations (assuming applied ones are marked with "[applied]")
    const appliedMigrations = migrationOutput
        .split('\n')
        .filter((line) => line.includes('[applied]'))
        .map((line) => line.replace(/\[applied\]/i, '').trim());
    const lastApplied = appliedMigrations.length > 0
        ? appliedMigrations[appliedMigrations.length - 1]
        : '0';
    core.info(`Current applied migration (baseline): ${lastApplied}`);
    return lastApplied;
}
/**
 * Gets the last non-pending migration.
 *
 * This function uses the "dotnet-ef migrations list" command to list migrations,
 * then filters out any lines marked as pending (such as those containing "(pending)").
 * The last non-pending migration is returned.
 *
 * @param getExecOutput - If true, uses exec.getExecOutput to capture output; otherwise, streams output.
 * @param envName - The ASPNETCORE_ENVIRONMENT value.
 * @param home - Home directory for the environment variables.
 * @param migrationsFolder - Folder where migrations are stored.
 * @param dotnetRoot - Path to the dotnet executable.
 * @param useGlobalDotnetEf - If true, use the global dotnet-ef installation; else, run through the local tool.
 *
 * @returns A Promise that resolves with the last non-pending migration name, or '0' if none is found.
 *
 * @example
 * ```ts
 * const lastNonPending = await getLastNonPendingMigration(
 *   false,                    // Stream output mode
 *   'Staging',                // Environment name
 *   '/home/user',             // Home directory
 *   './src/Migrations',       // Migrations folder
 *   '/usr/local/share/dotnet',// Path to dotnet executable
 *   true                      // Use global dotnet-ef
 * )
 * console.log(`Last non-pending migration: ${lastNonPending}`)
 * ```
 */
export async function getLastNonPendingMigration(getExecOutput, envName, home, migrationsFolder, dotnetRoot, useGlobalDotnetEf) {
    let migrationOutput = '';
    const baseEnv = {
        DOTNET_ROOT: dotnetRoot,
        HOME: process.env.HOME || home,
        ASPNETCORE_ENVIRONMENT: envName
    };
    const migrationOptions = {
        cwd: migrationsFolder,
        env: baseEnv,
        listeners: {
            stdout: (data) => {
                migrationOutput += data.toString();
            }
        }
    };
    let efCmd, efArgs;
    if (useGlobalDotnetEf) {
        efCmd = 'dotnet-ef';
        efArgs = ['migrations', 'list'];
    }
    else {
        efCmd = dotnetRoot;
        efArgs = ['tool', 'run', 'dotnet-ef', 'migrations', 'list'];
    }
    if (getExecOutput) {
        const result = await exec.getExecOutput(efCmd, efArgs, migrationOptions);
        migrationOutput += result.stdout;
    }
    else {
        await exec.exec(efCmd, efArgs, migrationOptions);
    }
    core.info(`Full migration output:\n${migrationOutput}`);
    // Process each migration line and filter out pending ones (lines containing "(pending)")
    const migrationLines = migrationOutput.split('\n').map((line) => line.trim());
    const nonPendingMigrations = migrationLines.filter((line) => line !== '' && !/\(pending\)/i.test(line));
    const lastMigration = nonPendingMigrations.length > 0
        ? nonPendingMigrations[nonPendingMigrations.length - 1]
        : '0';
    core.info(`Last non-pending migration: ${lastMigration}`);
    return lastMigration;
}
/*
// Example usage:
//
// (async () => {
//   try {
//     // Process migrations (apply pending migrations if any) and capture the last applied migration
//     const lastApplied = await processMigrations(
//       true,                    // Capture output mode
//       'Development',           // ASPNETCORE_ENVIRONMENT
//       '/home/user',            // Home directory
//       './src/Migrations',      // Folder containing migrations
//       '/usr/local/share/dotnet', // dotnet executable path
//       false                    // Use local dotnet-ef tool
//     )
//     core.info(`Last applied migration: ${lastApplied}`)
//
//     // Retrieve the current applied migration from the database
//     const currentMigration = await getCurrentAppliedMigration(
//       true,
//       'Production',
//       '/home/user',
//       './src/Migrations',
//       '/usr/local/share/dotnet',
//       true
//     )
//     core.info(`Current applied migration: ${currentMigration}`)
//
//     // Retrieve the last non-pending migration (ignoring pending migrations)
//     const lastNonPending = await getLastNonPendingMigration(
//       false,
//       'Staging',
//       '/home/user',
//       './src/Migrations',
//       '/usr/local/share/dotnet',
//       true
//     )
//     core.info(`Last non-pending migration: ${lastNonPending}`)
//   } catch (error) {
//     core.error(`Error processing migrations: ${error}`)
//     process.exit(1)
//   }
// })()
*/
/**
 * Rolls back EF Core database migrations in a GitHub Actions workflow.
 *
 * This function automates the execution of the `dotnet ef database update <targetMigration>`
 * command, allowing for rollback to a specified migration. It supports both local and global installations
 * of the `dotnet-ef` tool, and provides an option to capture and log command output.
 *
 * @param getExecOutput - If true, uses `getExecOutput` to capture the stdout and stderr of the rollback command.
 * @param envName - The ASP.NET Core environment name to use (e.g., "Development", "Staging", "Production").
 * @param home - The home directory path to set as `HOME` in the execution environment.
 * @param migrationsFolder - The working directory where the migrations should be run.
 * @param dotnetRoot - Path to the local dotnet executable or root directory (used when not using global dotnet-ef).
 * @param useGlobalDotnetEf - Whether to use a globally installed `dotnet-ef` CLI tool.
 * @param targetMigration - The migration name or ID to which the database should be rolled back.
 *
 * @returns A Promise that resolves once the rollback process is complete.
 *
 * @example
 * ```ts
 * await rollbackMigrations(
 *   true,
 *   'Development',
 *   '/home/runner',
 *   './src/MyApp.Infrastructure',
 *   '/home/runner/.dotnet',
 *   false,
 *   'InitialCreate'
 * )
 * ```
 *
 * This would rollback the database to the 'InitialCreate' migration using a locally installed dotnet-ef tool,
 * capturing and logging the command output.
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
    const execOptions = {
        cwd: migrationsFolder,
        env: baseEnv
    };
    if (getExecOutput) {
        const result = await exec.getExecOutput(useGlobalDotnetEf ? 'dotnet-ef' : dotnetRoot, rollbackArgs, execOptions);
        core.info(result.stdout);
    }
    else {
        await exec.exec(useGlobalDotnetEf ? 'dotnet-ef' : dotnetRoot, rollbackArgs, execOptions);
    }
    core.info('Rollback completed successfully.');
}
