import { jest } from '@jest/globals'

export const exec = jest
  .fn<
    (
      command: string,
      args?: string[],
      options?: { cwd?: string }
    ) => Promise<number>
  >()
  .mockImplementation(async (command, args, options) => {
    // Default mock implementation, can be overridden in tests
    console.log(`Mock exec called with:`, { command, args, options })
    return 0 // Default resolved value
  })
