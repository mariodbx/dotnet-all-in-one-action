import { jest } from '@jest/globals'

export const exec = jest
  .fn<
    (
      command: string,
      args?: string[],
      options?: { cwd?: string }
    ) => Promise<number>
  >()
  .mockResolvedValue(0) // Ensure it returns a resolved Promise<number>
