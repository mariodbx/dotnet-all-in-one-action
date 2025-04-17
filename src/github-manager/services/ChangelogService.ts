import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { IChangelogService } from '../interfaces/IChangelogService.js'

export class ChangelogService implements IChangelogService {
  public async generateChangelog(
    previousTag: string,
    currentTag: string,
    repo: string,
    owner: string
  ): Promise<string> {
    try {
      core.info(
        `Generating changelog between tags: ${previousTag} and ${currentTag}`
      )
      let output = ''
      const options = {
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString()
          }
        }
      }
      await exec(
        'gh',
        [
          'changelog',
          '--repo',
          `${owner}/${repo}`,
          '--from',
          previousTag,
          '--to',
          currentTag
        ],
        options
      )
      return output
    } catch (error) {
      core.error('Failed to generate changelog')
      throw error
    }
  }
}
