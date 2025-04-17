/**
 * Interface for GitHub Action inputs.
 *
 * @remarks
 * This interface defines all the inputs required for the GitHub Action.
 */
export interface IActionInputs {
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
  version: string
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
  runDockerBuild: boolean
  runDockerPush: boolean

  // Release
  runRelease: boolean

  // Changelog
  includeGhcrPackage: boolean
  includeDotnetBinaries: boolean
  runChangelog: boolean
  majorKeywords: string
  minorKeywords: string
  patchKeywords: string
  hotfixKeywords: string
  addedKeywords: string
  devKeywords: string

  // Publish
  runPublish: boolean
  publishLinux: boolean
  publishWindows: boolean
  publishMac: boolean
}
