export interface IMigrationService {
  processMigrations(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string>

  rollbackMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean,
    targetMigration: string
  ): Promise<void>

  getCurrentAppliedMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string>

  getLastNonPendingMigration(
    envName: string,
    home: string,
    migrationsFolder: string,
    dotnetRoot: string,
    useGlobalDotnetEf: boolean
  ): Promise<string>
}
