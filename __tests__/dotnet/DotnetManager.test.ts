import { jest } from '@jest/globals'
import { DotnetManager } from '../../src/dotnet/DotnetManager.js'
import * as coreFixture from '../../__fixtures__/core.js'
import { IDotnetService } from '../../src/dotnet/interfaces/IDotnetService.js'
import { ICsprojService } from '../../src/dotnet/interfaces/ICsprojService.js'
import { IMigrationService } from '../../src/dotnet/interfaces/IMigrationService.js'
import { ITestService } from '../../src/dotnet/interfaces/ITestService.js'

describe('DotnetManager', () => {
  const mockDotnetService: jest.Mocked<IDotnetService> = {
    installDotnetEf: jest.fn(),
    publishProject: jest.fn()
  }

  const mockCsprojService: jest.Mocked<ICsprojService> = {
    findCsproj: jest.fn(),
    readCsproj: jest.fn(),
    updateCsproj: jest.fn(),
    extractVersion: jest.fn(),
    updateVersion: jest.fn(),
    createVersionIfNotExists: jest.fn(),
    createVersionSuffixIfNotExists: jest.fn()
  }

  const mockMigrationService: jest.Mocked<IMigrationService> = {
    processMigrations: jest.fn(),
    rollbackMigration: jest.fn(),
    getCurrentAppliedMigration: jest.fn(),
    getLastNonPendingMigration: jest.fn()
  }

  const mockTestService: jest.Mocked<ITestService> = {
    runTests: jest.fn()
  }

  const mockCore = coreFixture

  let dotnetManager: DotnetManager

  beforeEach(() => {
    jest.clearAllMocks()
    dotnetManager = new DotnetManager(
      mockDotnetService,
      mockCsprojService,
      mockMigrationService,
      mockTestService
    )
  })

  describe('installDotnetEf', () => {
    test('should install dotnet-ef tool', async () => {
      await dotnetManager.installDotnetEf()
      expect(mockDotnetService.installDotnetEf).toHaveBeenCalled()
      expect(mockCore.info).toHaveBeenCalledWith('Installing dotnet-ef tool...')
    })
  })

  describe('publishProject', () => {
    test('should publish a .NET project', async () => {
      const configuration = 'Release'
      const outputDir = './output'
      const additionalFlags = ['--no-restore']

      await dotnetManager.publishProject(
        configuration,
        outputDir,
        additionalFlags
      )
      expect(mockDotnetService.publishProject).toHaveBeenCalledWith(
        configuration,
        outputDir,
        additionalFlags
      )
      expect(mockCore.info).toHaveBeenCalledWith('Publishing .NET project...')
    })
  })

  describe('findCsproj', () => {
    test('should find a .csproj file', async () => {
      const csprojDepth = 2
      const csprojName = 'test.csproj'
      mockCsprojService.findCsproj.mockResolvedValue('/path/to/test.csproj')

      const result = await dotnetManager.findCsproj(csprojDepth, csprojName)
      expect(result).toBe('/path/to/test.csproj')
      expect(mockCsprojService.findCsproj).toHaveBeenCalledWith(
        csprojDepth,
        csprojName
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Searching for .csproj file: ${csprojName} within depth ${csprojDepth}...`
      )
    })
  })

  describe('readCsproj', () => {
    test('should read a .csproj file', async () => {
      const csprojPath = '/path/to/test.csproj'
      mockCsprojService.readCsproj.mockResolvedValue('<Project></Project>')

      const result = await dotnetManager.readCsproj(csprojPath)
      expect(result).toBe('<Project></Project>')
      expect(mockCsprojService.readCsproj).toHaveBeenCalledWith(csprojPath)
      expect(mockCore.info).toHaveBeenCalledWith(
        `Reading .csproj file: ${csprojPath}...`
      )
    })
  })

  describe('updateCsproj', () => {
    test('should update a .csproj file', async () => {
      const csprojPath = '/path/to/test.csproj'
      const content = '<Project><PropertyGroup></PropertyGroup></Project>'

      await dotnetManager.updateCsproj(csprojPath, content)
      expect(mockCsprojService.updateCsproj).toHaveBeenCalledWith(
        csprojPath,
        content
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Updating .csproj file: ${csprojPath}...`
      )
    })
  })

  describe('extractVersion', () => {
    test('should extract version from .csproj content', () => {
      const csprojContent = '<Version>1.0.0</Version>'
      mockCsprojService.extractVersion.mockReturnValue('1.0.0')

      const result = dotnetManager.extractVersion(csprojContent)
      expect(result).toBe('1.0.0')
      expect(mockCsprojService.extractVersion).toHaveBeenCalledWith(
        csprojContent
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        'Extracting version from .csproj content...'
      )
    })
  })

  describe('updateVersion', () => {
    test('should update version in .csproj content', () => {
      const csprojContent = '<Version>1.0.0</Version>'
      const newVersion = '2.0.0'
      mockCsprojService.updateVersion.mockReturnValue(
        '<Version>2.0.0</Version>'
      )

      const result = dotnetManager.updateVersion(csprojContent, newVersion)
      expect(result).toBe('<Version>2.0.0</Version>')
      expect(mockCsprojService.updateVersion).toHaveBeenCalledWith(
        csprojContent,
        newVersion
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        'Updating version in .csproj content...'
      )
    })
  })

  describe('processMigrations', () => {
    test('should process EF Core migrations', async () => {
      const envName = 'Development'
      const home = '/home/user'
      const migrationsFolder = './migrations'
      const dotnetRoot = '/usr/local/share/dotnet'
      const useGlobalDotnetEf = true
      mockMigrationService.processMigrations.mockResolvedValue(
        'MigrationResult'
      )

      const result = await dotnetManager.processMigrations(
        envName,
        home,
        migrationsFolder,
        dotnetRoot,
        useGlobalDotnetEf
      )
      expect(result).toBe('MigrationResult')
      expect(mockMigrationService.processMigrations).toHaveBeenCalledWith(
        envName,
        home,
        migrationsFolder,
        dotnetRoot,
        useGlobalDotnetEf
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        'Processing EF Core migrations...'
      )
    })
  })

  describe('rollbackMigration', () => {
    test('should rollback to a specific migration', async () => {
      const envName = 'Development'
      const home = '/home/user'
      const migrationsFolder = './migrations'
      const dotnetRoot = '/usr/local/share/dotnet'
      const useGlobalDotnetEf = true
      const targetMigration = 'InitialMigration'

      await dotnetManager.rollbackMigration(
        envName,
        home,
        migrationsFolder,
        dotnetRoot,
        useGlobalDotnetEf,
        targetMigration
      )
      expect(mockMigrationService.rollbackMigration).toHaveBeenCalledWith(
        envName,
        home,
        migrationsFolder,
        dotnetRoot,
        useGlobalDotnetEf,
        targetMigration
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Rolling back to migration: ${targetMigration}...`
      )
    })
  })

  describe('runTests', () => {
    test('should run tests', async () => {
      const envName = 'Development'
      const testFolder = './tests'
      const testOutputFolder = './test-results'
      const testFormat = 'trx'

      await dotnetManager.runTests(
        envName,
        testFolder,
        testOutputFolder,
        testFormat
      )
      expect(mockTestService.runTests).toHaveBeenCalledWith(
        envName,
        testFolder,
        testOutputFolder,
        testFormat
      )
      expect(mockCore.info).toHaveBeenCalledWith('Running tests...')
    })
  })
})
