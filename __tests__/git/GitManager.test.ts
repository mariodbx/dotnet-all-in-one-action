import { jest } from '@jest/globals' // Import jest explicitly
import { GitManager } from '../../src/git/GitManager.js'
import * as execFixture from '../../__fixtures__/exec.js'
import * as coreFixture from '../../__fixtures__/core.js'

describe('GitManager', () => {
  const mockExec = execFixture
  const mockCore = coreFixture

  const defaultOptions = {
    actor: 'test-actor',
    token: 'test-token',
    repo: 'test-repo'
  }

  let gitManager: GitManager

  beforeEach(() => {
    jest.clearAllMocks() // Clear all mocks before each test

    jest.spyOn(mockExec, 'exec').mockResolvedValue(0) // Spy on and mock the exec method
    jest.spyOn(mockCore, 'info').mockImplementation(jest.fn()) // Spy on and mock the info method

    gitManager = new GitManager(defaultOptions, {
      exec: { exec: mockExec.exec }, // Wrap mockExec in an object with an exec property
      core: mockCore
    })
  })

  describe('constructor', () => {
    test('should throw an error if GITHUB_ACTOR is not defined', () => {
      expect(() => {
        new GitManager(
          { token: 'test-token', repo: 'test-repo' },
          { exec: mockExec, core: mockCore }
        )
      }).toThrow('GITHUB_ACTOR is not defined')
    })

    test('should throw an error if GITHUB_TOKEN is not defined', () => {
      expect(() => {
        new GitManager(
          { actor: 'test-actor', repo: 'test-repo' },
          { exec: mockExec, core: mockCore }
        )
      }).toThrow('GITHUB_TOKEN is not defined')
    })

    test('should throw an error if GITHUB_REPOSITORY is not defined', () => {
      expect(() => {
        new GitManager(
          { actor: 'test-actor', token: 'test-token' },
          { exec: mockExec, core: mockCore }
        )
      }).toThrow('GITHUB_REPOSITORY is not defined')
    })
  })

  describe('execGitCommand', () => {
    test('should throw an error if a Git command fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const localDir = '/tmp/repo'
      const gitManager = new GitManager(defaultOptions, {
        exec: mockExec,
        core: mockCore
      })

      await expect(
        gitManager['execGitCommand'](['status'], localDir)
      ).rejects.toThrow(
        'Git command failed: status in directory: /tmp/repo. Original error: Command failed'
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        'Git command failed: status in directory: /tmp/repo'
      )
    })
  })

  describe('configureGit', () => {
    test('should configure Git with actor and email', async () => {
      await gitManager['configureGit']()
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['config', '--global', 'user.name', 'test-actor'],
        undefined
      ) // Include undefined for the options parameter
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        [
          'config',
          '--global',
          'user.email',
          'test-actor@users.noreply.github.com'
        ],
        undefined
      ) // Include undefined for the options parameter
      expect(mockCore.info).toHaveBeenCalledWith(
        'Configured Git for user: test-actor'
      )
    })

    test('should throw an error if configuring Git fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const gitManager = new GitManager(defaultOptions, {
        exec: mockExec,
        core: mockCore
      })

      await expect(gitManager['configureGit']()).rejects.toThrow(
        'Failed to configure Git user settings. Original error: Git command failed: config --global user.name test-actor in directory: current working directory. Original error: Command failed'
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        'Failed to configure Git user settings'
      )
    })
  })

  describe('cloneRepo', () => {
    test('should clone a repository', async () => {
      const localDir = '/tmp/repo'
      await gitManager.cloneRepo(localDir)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        [
          'clone',
          'https://test-actor:test-token@github.com/test-repo.git',
          localDir
        ],
        undefined
      ) // Include undefined for the options parameter
      expect(mockCore.info).toHaveBeenCalledWith(
        `Cloning repository test-repo into directory: ${localDir}`
      )
    })

    test('should throw an error if cloning the repository fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const localDir = '/tmp/repo'
      const gitManager = new GitManager(defaultOptions, {
        exec: mockExec,
        core: mockCore
      })

      await expect(gitManager.cloneRepo(localDir)).rejects.toThrow(
        `Failed to clone repository test-repo into directory: ${localDir}. Original error: Git command failed: clone https://test-actor:test-token@github.com/test-repo.git ${localDir} in directory: current working directory. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to clone repository test-repo into directory: ${localDir}`
      )
    })
  })

  describe('pullRepo', () => {
    test('should pull the latest changes from a branch', async () => {
      const localDir = '/tmp/repo'
      const branch = 'main'
      await gitManager.pullRepo(localDir, branch)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['pull', 'origin', branch],
        {
          cwd: localDir
        }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Pulling latest changes from branch ${branch}`
      )
    })

    test('should throw an error if pulling the repository fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const localDir = '/tmp/repo'
      const branch = 'main'
      const gitManager = new GitManager(defaultOptions, {
        exec: mockExec,
        core: mockCore
      })

      await expect(gitManager.pullRepo(localDir, branch)).rejects.toThrow(
        `Failed to pull latest changes from branch ${branch} in directory: ${localDir}. Original error: Failed to configure Git user settings. Original error: Git command failed: config --global user.name test-actor in directory: current working directory. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to pull latest changes from branch ${branch} in directory: ${localDir}`
      )
    })
  })

  describe('commitAndPush', () => {
    test('should commit and push changes', async () => {
      const localDir = '/tmp/repo'
      const commitMessage = 'Test commit'
      await gitManager.commitAndPush(localDir, commitMessage)
      expect(mockExec.exec).toHaveBeenCalledWith('git', ['add', '.'], {
        cwd: localDir
      })
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['commit', '-m', commitMessage],
        { cwd: localDir }
      )
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['push', 'origin', 'HEAD'],
        {
          cwd: localDir
        }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        'Committing and pushing changes'
      )
    })
  })

  describe('createAndCheckoutBranch', () => {
    test('should create and checkout a new branch', async () => {
      const localDir = '/tmp/repo'
      const branchName = 'new-branch'
      await gitManager.createAndCheckoutBranch(localDir, branchName)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['checkout', '-b', branchName],
        { cwd: localDir }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Creating and checking out branch ${branchName}`
      )
    })
  })

  describe('checkoutBranch', () => {
    test('should checkout an existing branch', async () => {
      const localDir = '/tmp/repo'
      const branchName = 'existing-branch'
      await gitManager.checkoutBranch(localDir, branchName)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['checkout', branchName],
        {
          cwd: localDir
        }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Checking out branch ${branchName}`
      )
    })
  })

  describe('mergeBranch', () => {
    test('should merge a branch into the current branch', async () => {
      const localDir = '/tmp/repo'
      const branchToMerge = 'feature-branch'
      await gitManager.mergeBranch(localDir, branchToMerge)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['merge', branchToMerge],
        {
          cwd: localDir
        }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Merging branch ${branchToMerge}`
      )
    })

    test('should merge a branch without conflict strategy', async () => {
      const localDir = '/tmp/repo'
      const branchToMerge = 'feature-branch'
      await gitManager.mergeBranch(localDir, branchToMerge)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['merge', branchToMerge],
        { cwd: localDir }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Merging branch ${branchToMerge}`
      )
    })

    test('should merge a branch with "ours" conflict strategy', async () => {
      const localDir = '/tmp/repo'
      const branchToMerge = 'feature-branch'
      await gitManager.mergeBranch(localDir, branchToMerge, 'ours')
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['merge', branchToMerge, '-Xours'],
        { cwd: localDir }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Merging branch ${branchToMerge}`
      )
    })

    test('should merge a branch with "theirs" conflict strategy', async () => {
      const localDir = '/tmp/repo'
      const branchToMerge = 'feature-branch'
      await gitManager.mergeBranch(localDir, branchToMerge, 'theirs')
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['merge', branchToMerge, '-Xtheirs'],
        { cwd: localDir }
      )
      expect(mockCore.info).toHaveBeenCalledWith(
        `Merging branch ${branchToMerge}`
      )
    })

    test('should throw an error if merging the branch fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const localDir = '/tmp/repo'
      const branchToMerge = 'feature-branch'

      await expect(
        gitManager.mergeBranch(localDir, branchToMerge)
      ).rejects.toThrow(
        `Failed to merge branch ${branchToMerge} into directory: ${localDir}. Original error: Failed to configure Git user settings. Original error: Git command failed: config --global user.name test-actor in directory: current working directory. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to merge branch ${branchToMerge} into directory: ${localDir}`
      )
    })
  })

  describe('pushBranch', () => {
    test('should push a branch to the remote repository', async () => {
      const localDir = '/tmp/repo'
      const branchName = 'feature-branch'
      await gitManager.pushBranch(localDir, branchName)
      expect(mockExec.exec).toHaveBeenCalledWith(
        'git',
        ['push', '-u', 'origin', branchName],
        { cwd: localDir }
      )
      expect(mockCore.info).toHaveBeenCalledWith(`Pushing branch ${branchName}`)
    })
  })

  describe('cleanRepo', () => {
    test('should clean the repository', async () => {
      const localDir = '/tmp/repo'
      await gitManager.cleanRepo(localDir)
      expect(mockExec.exec).toHaveBeenCalledWith('git', ['clean', '-fdx'], {
        cwd: localDir
      })
      expect(mockCore.info).toHaveBeenCalledWith(
        `Cleaning repository in directory: ${localDir}`
      )
    })

    test('should throw an error if cleaning the repository fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const localDir = '/tmp/repo'

      await expect(gitManager.cleanRepo(localDir)).rejects.toThrow(
        `Failed to clean repository in directory: ${localDir}. Original error: Git command failed: clean -fdx in directory: ${localDir}. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to clean repository in directory: ${localDir}`
      )
    })
  })

  describe('restoreRepo', () => {
    test('should restore the repository', async () => {
      const localDir = '/tmp/repo'
      await gitManager.restoreRepo(localDir)
      expect(mockExec.exec).toHaveBeenCalledWith('git', ['restore', '.'], {
        cwd: localDir
      })
      expect(mockCore.info).toHaveBeenCalledWith(
        `Restoring repository in directory: ${localDir}`
      )
    })

    test('should throw an error if restoring the repository fails', async () => {
      jest
        .spyOn(mockExec, 'exec')
        .mockRejectedValue(new Error('Command failed'))
      const localDir = '/tmp/repo'

      await expect(gitManager.restoreRepo(localDir)).rejects.toThrow(
        `Failed to restore repository in directory: ${localDir}. Original error: Git command failed: restore . in directory: ${localDir}. Original error: Command failed`
      )
      expect(mockCore.error).toHaveBeenCalledWith(
        `Failed to restore repository in directory: ${localDir}`
      )
    })
  })
})
