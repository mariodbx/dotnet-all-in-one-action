export interface ICsprojService {
  findCsproj(csprojDepth: number, csprojName: string): Promise<string>
  readCsproj(csprojPath: string): Promise<string>
  updateCsproj(csprojPath: string, content: string): Promise<void>
  extractVersion(csprojContent: string): string
  updateVersion(csprojContent: string, newVersion: string): string
  createVersionIfNotExists(
    csprojContent: string,
    defaultVersion: string
  ): string
  createVersionSuffixIfNotExists(
    csprojContent: string,
    defaultSuffix: string
  ): string
}
