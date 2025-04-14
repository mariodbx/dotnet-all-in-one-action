import { jest } from '@jest/globals'

export const wait = jest.fn<typeof import('../src/utils/wait.js').wait>()
