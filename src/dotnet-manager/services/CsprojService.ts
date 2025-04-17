import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as fs from 'fs/promises'
import * as path from 'path'
import { ICsprojService } from '../interfaces/ICsprojService.js'
import { DotnetBase } from '../base/DotnetBase.js'

export class CsprojService extends DotnetBase implements ICsprojService {
  constructor(dependencies = { exec, core }) {
    super(dependencies)
  }

  async findCsproj(csprojDepth: number, csprojName: string): Promise<string> {
    try {
      const searchDir = path.resolve('.')

      const findFiles = async (
        dir: string,
        depth: number
      ): Promise<string[]> => {
        if (depth < 0) return []
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const files: string[] = []

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            files.push(...(await findFiles(fullPath, depth - 1)))
          } else if (entry.isFile() && entry.name === csprojName) {
            files.push(fullPath)
          }
        }

        return files
      }

      const paths = await findFiles(searchDir, csprojDepth)
      if (paths.length === 0) {
        throw new Error(
          `.csproj file named "${csprojName}" not found within depth ${csprojDepth}`
        )
      }
      return paths[0]
    } catch (error) {
      throw new Error(
        `Failed to find .csproj file: ${(error as Error).message}`
      )
    }
  }

  async readCsproj(csprojPath: string): Promise<string> {
    try {
      return await fs.readFile(csprojPath, 'utf8')
    } catch (error) {
      throw new Error(
        `Failed to read .csproj file at ${csprojPath}: ${(error as Error).message}`
      )
    }
  }

  async updateCsproj(csprojPath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(csprojPath, content, 'utf8')
    } catch (error) {
      throw new Error(
        `Failed to update .csproj file at ${csprojPath}: ${(error as Error).message}`
      )
    }
  }

  extractVersion(csprojContent: string): string {
    try {
      const versionMatch = csprojContent.match(/<Version>(.*?)<\/Version>/)
      if (!versionMatch) {
        throw new Error('Version tag not found in .csproj content')
      }
      return versionMatch[1]
    } catch (error) {
      throw new Error(`Failed to extract version: ${(error as Error).message}`)
    }
  }

  updateVersion(csprojContent: string, newVersion: string): string {
    try {
      if (!/<Version>.*?<\/Version>/.test(csprojContent)) {
        throw new Error('Version tag not found in .csproj content')
      }
      return csprojContent.replace(
        /<Version>.*?<\/Version>/,
        `<Version>${newVersion}</Version>`
      )
    } catch (error) {
      throw new Error(`Failed to update version: ${(error as Error).message}`)
    }
  }

  extractVersionSuffix(csprojContent: string): string {
    try {
      const suffixRegex = /<VersionSuffix>([^<]+)<\/VersionSuffix>/
      const match = csprojContent.match(suffixRegex)
      if (!match) {
        throw new Error('No version suffix found in .csproj content')
      }
      return match[1].trim()
    } catch (error) {
      throw new Error(
        `Failed to extract version suffix: ${(error as Error).message}`
      )
    }
  }

  updateVersionSuffixContent(csprojContent: string, newSuffix: string): string {
    try {
      const suffixRegex = /<VersionSuffix>([^<]+)<\/VersionSuffix>/
      if (!suffixRegex.test(csprojContent)) {
        throw new Error('Version suffix tag not found in .csproj content')
      }
      return csprojContent.replace(
        suffixRegex,
        `<VersionSuffix>${newSuffix}</VersionSuffix>`
      )
    } catch (error) {
      throw new Error(
        `Failed to update version suffix: ${(error as Error).message}`
      )
    }
  }

  removeVersionSuffix(csprojContent: string): string {
    try {
      const suffixRegex = /<VersionSuffix>[^<]+<\/VersionSuffix>\s*/
      if (!suffixRegex.test(csprojContent)) {
        throw new Error('Version suffix tag not found in .csproj content')
      }
      return csprojContent.replace(suffixRegex, '')
    } catch (error) {
      throw new Error(
        `Failed to remove version suffix: ${(error as Error).message}`
      )
    }
  }

  createVersionIfNotExists(
    csprojContent: string,
    defaultVersion: string
  ): string {
    try {
      if (!/<Version>.*?<\/Version>/.test(csprojContent)) {
        const insertPosition = csprojContent.indexOf('</PropertyGroup>')
        if (insertPosition === -1) {
          throw new Error('No <PropertyGroup> found to insert <Version>')
        }
        return (
          csprojContent.slice(0, insertPosition) +
          `  <Version>${defaultVersion}</Version>\n` +
          csprojContent.slice(insertPosition)
        )
      }
      return csprojContent
    } catch (error) {
      throw new Error(
        `Failed to create version tag: ${(error as Error).message}`
      )
    }
  }

  createVersionSuffixIfNotExists(
    csprojContent: string,
    defaultSuffix: string
  ): string {
    try {
      if (!/<VersionSuffix>.*?<\/VersionSuffix>/.test(csprojContent)) {
        const insertPosition = csprojContent.indexOf('</PropertyGroup>')
        if (insertPosition === -1) {
          throw new Error('No <PropertyGroup> found to insert <VersionSuffix>')
        }
        return (
          csprojContent.slice(0, insertPosition) +
          `  <VersionSuffix>${defaultSuffix}</VersionSuffix>\n` +
          csprojContent.slice(insertPosition)
        )
      }
      return csprojContent
    } catch (error) {
      throw new Error(
        `Failed to create version suffix tag: ${(error as Error).message}`
      )
    }
  }
}
