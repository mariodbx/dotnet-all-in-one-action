import * as core from '@actions/core'
import * as exec from '@actions/exec'

/**
 * Represents the dependencies required for executing .NET-related actions.
 * This interface abstracts the core and exec modules from GitHub Actions.
 */
export interface IDotnetDependencies {
  /**
   * Provides methods for executing shell commands.
   */
  exec: typeof exec

  /**
   * Provides utility functions for logging and setting outputs in GitHub Actions.
   */
  core: typeof core
}
