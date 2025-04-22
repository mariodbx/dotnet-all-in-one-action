import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'

// Common utilities
const handleError = (prefix: string, error: unknown): never => {
  const message = `${prefix}: ${(error as Error).message}`
  core.error(message)
  throw new Error(message)
}

// Test Service Functions
export async function runTests(
  envName: string,
  testFolder: string,
  testOutputFolder: string,
  testFormat?: string
): Promise<void> {
  core.info(`Setting DOTNET_ENVIRONMENT to "${envName}"...`)

  if (!fs.existsSync(testFolder)) {
    throw new Error(`Test folder does not exist: ${testFolder}`)
  }

  process.env.DOTNET_ENVIRONMENT = envName
  core.info(`Running tests in folder: ${testFolder}...`)

  const args = ['test', testFolder, '--verbosity', 'detailed']
  const resolvedOutputFolder = path.resolve(testOutputFolder)

  if (testFormat) {
    const resultFileName = `TestResults.${testFormat}`
    const resultFilePath = path.join(resolvedOutputFolder, resultFileName)
    fs.mkdirSync(resolvedOutputFolder, { recursive: true })
    args.push('--logger', `${testFormat};LogFileName=${resultFilePath}`)
  }

  try {
    const { stdout } = await exec.getExecOutput('dotnet', args)
    core.info(stdout)
    core.info('Tests completed successfully.')
  } catch (error) {
    handleError('Test execution error', error)
  }
}

export async function cleanTestResults(
  testOutputFolder: string
): Promise<void> {
  try {
    if (fs.existsSync(testOutputFolder)) {
      fs.rmSync(testOutputFolder, { recursive: true, force: true })
      core.info('Test results cleaned.')
    } else {
      core.info('No test results to clean.')
    }
  } catch (error) {
    handleError('Clean test results failed', error)
  }
}

// Migration Service Functions
export async function processMigrations(
  envName: string,
  home: string,
  migrationsFolder: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean
): Promise<string> {
  try {
    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`

    const args = [
      efTool,
      'database',
      'update',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]

    await exec.exec('dotnet', args, { cwd: home })
    return 'Migrations applied successfully'
  } catch (error) {
    handleError('Migration failed', error)
    return '' // This will never be reached due to handleError throwing
  }
}

export async function rollbackMigration(
  envName: string,
  home: string,
  migrationsFolder: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean,
  targetMigration: string
): Promise<void> {
  try {
    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`

    const args = [
      efTool,
      'database',
      'update',
      targetMigration,
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]

    await exec.exec('dotnet', args, { cwd: home })
  } catch (error) {
    handleError('Rollback migration failed', error)
  }
}

/**
 * Get the latest applied migration from the database
 */
export async function getCurrentAppliedMigration(
  envName: string,
  home: string,
  migrationsFolder: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean
): Promise<string> {
  try {
    if (!useGlobalDotnetEf) {
      await installDotnetEf()
    }

    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`

    const args = [
      efTool,
      'migrations',
      'list',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]

    const { stdout } = await exec.getExecOutput('dotnet', args, { cwd: home })

    // Find all applied migrations and return the most recent one
    const applied = stdout
      .split('\n')
      .filter((line) => line.includes('[applied]'))
      .map((line) => line.replace('[applied]', '').trim())
      .filter(Boolean)

    return applied.length > 0 ? applied[applied.length - 1] : '0'
  } catch (error) {
    handleError('Fetch current migration failed', error)
    return '' // This line will never be reached, but it satisfies TypeScript
  }
}

/**
 * Get the last migration that isn't pending
 */
export async function getLastNonPendingMigration(
  envName: string,
  home: string,
  migrationsFolder: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean
): Promise<string> {
  try {
    if (!useGlobalDotnetEf) {
      await installDotnetEf()
    }

    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`

    const args = [
      efTool,
      'migrations',
      'list',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]

    const { stdout } = await exec.getExecOutput('dotnet', args, { cwd: home })

    // Find all non-pending migrations and return the most recent one
    const nonPending = stdout
      .split('\n')
      .filter((line) => line.trim() && !line.includes('(pending)'))
      .filter(Boolean)

    return nonPending.length > 0 ? nonPending[nonPending.length - 1] : '0'
  } catch (error) {
    handleError('Get non-pending migration failed', error)
    return '' // This line will never be reached, but it satisfies TypeScript
  }
}

/**
 * Add a new migration to the project
 */
export async function addMigration(
  migrationName: string,
  outputDir: string,
  context?: string
): Promise<void> {
  if (!migrationName || migrationName.trim() === '') {
    throw new Error('Migration name cannot be empty')
  }

  try {
    core.info(`Creating migration '${migrationName}' in '${outputDir}'...`)

    const args = [
      'ef',
      'migrations',
      'add',
      migrationName,
      '--output-dir',
      outputDir
    ]

    if (context) {
      args.push('--context', context)
      core.info(`Using DB context: ${context}`)
    }

    const { stdout } = await exec.getExecOutput('dotnet', args)
    core.info(stdout)
    core.info(`Migration '${migrationName}' created successfully`)
  } catch (error) {
    handleError('Add migration failed', error)
  }
}

export async function updateDatabase(
  envName: string,
  home: string,
  migrationsFolder: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean
): Promise<void> {
  try {
    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`

    const args = [
      efTool,
      'database',
      'update',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]

    await exec.exec('dotnet', args, { cwd: home })
  } catch (error) {
    handleError('Update database failed', error)
  }
}

export async function listMigrations(
  envName: string,
  home: string,
  migrationsFolder: string,
  dotnetRoot: string,
  useGlobalDotnetEf: boolean
): Promise<string[]> {
  try {
    const efTool = useGlobalDotnetEf ? 'dotnet-ef' : `${dotnetRoot}/dotnet-ef`

    const args = [
      efTool,
      'migrations',
      'list',
      '--project',
      migrationsFolder,
      '--environment',
      envName
    ]

    const { stdout } = await exec.getExecOutput('dotnet', args, { cwd: home })

    return stdout.split('\n').filter((line) => line.trim())
  } catch (error) {
    handleError('List migrations failed', error)
    return [] // This will never be reached due to handleError throwing
  }
}

// Tool Installation Functions
export async function installDotnetEfLocally(): Promise<void> {
  try {
    await exec.exec('dotnet', ['tool', 'install', '--global', 'dotnet-ef'])
  } catch (error) {
    handleError('Global dotnet-ef install failed', error)
  }
}

export async function installDotnetEf(): Promise<void> {
  try {
    core.info('Creating or overwriting tool manifest...')
    await exec.exec('dotnet', ['new', 'tool-manifest', '--force'])

    core.info('Installing dotnet-ef as local tool...')
    await exec.exec('dotnet', ['tool', 'install', 'dotnet-ef'])

    core.info('dotnet-ef tool installed locally.')
  } catch (error) {
    handleError('Local dotnet-ef install failed', error)
  }
}
