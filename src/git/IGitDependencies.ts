export interface GitDependencies {
  exec: {
    exec: (
      command: string,
      args?: string[],
      options?: { cwd?: string }
    ) => Promise<number>
  }
  core: {
    info: (message: string) => void
    error: (message: string) => void
  }
}
