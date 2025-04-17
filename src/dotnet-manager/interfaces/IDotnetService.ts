export interface IDotnetService {
  /**
   * Installs the dotnet-ef tool globally.
   * This tool is used for managing Entity Framework Core migrations.
   */
  installDotnetEf(): Promise<void>

  /**
   * Publishes a .NET project with the specified configuration and output directory.
   * @param configuration - The build configuration (e.g., Debug or Release).
   * @param outputDir - The directory where the published files will be placed.
   * @param additionalFlags - Optional additional flags for the publish command.
   */
  publishProject(
    configuration: string,
    outputDir: string,
    additionalFlags?: string[]
  ): Promise<void>

  /**
   * Restores the NuGet packages for a .NET project.
   */
  restorePackages(): Promise<void>

  /**
   * Builds a .NET project with the specified configuration.
   * @param configuration - The build configuration (e.g., Debug or Release).
   */
  buildProject(configuration: string): Promise<void>
}
