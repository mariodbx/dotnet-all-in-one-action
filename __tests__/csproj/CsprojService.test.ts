import { jest } from '@jest/globals'
import { CsprojService } from '../../src/dotnet/services/CsprojService.js'
import * as execFixture from '../../__fixtures__/exec.js'
import * as coreFixture from '../../__fixtures__/core.js'

describe('CsprojService', () => {
  const mockExec = execFixture
  const mockCore = coreFixture

  const defaultOptions = {
    projectPath: '/path/to/project.csproj'
  }

  let csprojService: CsprojService

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(mockExec, 'exec').mockResolvedValue(0)
    jest.spyOn(mockCore, 'info').mockImplementation(jest.fn())

    csprojService = new CsprojService(defaultOptions, {
      exec: { exec: mockExec.exec },
      core: mockCore
    })

    jest
      .spyOn(csprojService, 'readCsproj')
      .mockResolvedValue('<Project></Project>')
    jest.spyOn(csprojService, 'updateCsproj').mockResolvedValue()
  })

  describe('constructor', () => {
    test('should throw an error if projectPath is not provided', () => {
      expect(() => {
        new CsprojService(
          { projectPath: '' },
          { exec: mockExec, core: mockCore }
        )
      }).toThrow('Project path is not defined')
    })
  })

  describe('addPackageReference', () => {
    test('should add a package reference to the project', async () => {
      const packageName = 'Newtonsoft.Json'
      const version = '13.0.1'
      await csprojService.addPackageReference(packageName, version)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'dotnet',
        [
          'add',
          defaultOptions.projectPath,
          'package',
          packageName,
          '--version',
          version
        ],
        undefined
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Added package reference: ${packageName} (version: ${version})`
      )
    })

    test('should throw an error if adding the package reference fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const packageName = 'Newtonsoft.Json'
      const version = '13.0.1'

      await expect(
        csprojService.addPackageReference(packageName, version)
      ).rejects.toThrow(
        `Failed to add package reference: ${packageName} (version: ${version}). Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to add package reference: ${packageName} (version: ${version})`
      )
    })
  })

  describe('removePackageReference', () => {
    test('should remove a package reference from the project', async () => {
      const packageName = 'Newtonsoft.Json'
      await csprojService.removePackageReference(packageName)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'dotnet',
        ['remove', defaultOptions.projectPath, 'package', packageName],
        undefined
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Removed package reference: ${packageName}`
      )
    })

    test('should throw an error if removing the package reference fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const packageName = 'Newtonsoft.Json'

      await expect(
        csprojService.removePackageReference(packageName)
      ).rejects.toThrow(
        `Failed to remove package reference: ${packageName}. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to remove package reference: ${packageName}`
      )
    })
  })

  describe('restorePackages', () => {
    test('should restore packages for the project', async () => {
      await csprojService.restorePackages()
      expect(mockExec.exec).toHaveBeenCalledWith(
        'dotnet',
        ['restore', defaultOptions.projectPath],
        undefined
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Restored packages for project: ${defaultOptions.projectPath}`
      )
    })

    test('should throw an error if restoring packages fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))

      await expect(csprojService.restorePackages()).rejects.toThrow(
        `Failed to restore packages for project: ${defaultOptions.projectPath}. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to restore packages for project: ${defaultOptions.projectPath}`
      )
    })
  })

  describe('buildProject', () => {
    test('should build the project', async () => {
      await csprojService.buildProject()
      expect(mockExec.exec).toHaveBeenCalledWith(
        'dotnet',
        ['build', defaultOptions.projectPath],
        undefined
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Built project: ${defaultOptions.projectPath}`
      )
    })

    test('should throw an error if building the project fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))

      await expect(csprojService.buildProject()).rejects.toThrow(
        `Failed to build project: ${defaultOptions.projectPath}. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to build project: ${defaultOptions.projectPath}`
      )
    })
  })
})
