// src/models/Dependencies.ts
import type * as core from '@actions/core'
import type * as exec from '@actions/exec'

export interface IDependencies {
  core: typeof core
  exec: typeof exec
}
