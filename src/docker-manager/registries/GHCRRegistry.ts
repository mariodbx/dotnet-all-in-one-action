import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IRegistry } from '../interfaces/IRegistry.js'

export class GHCRRegistry implements IRegistry {
  qualifyImageName(image: string): string {
    const owner =
      process.env.GITHUB_REPOSITORY?.toLowerCase().split('/')[0] ||
      'default-owner'
    if (image.startsWith('ghcr.io/')) {
      return image
    }
    return `ghcr.io/${owner}/${image}`
  }

  async login(showFullOutput: boolean): Promise<string> {
    const username = (process.env.GHCR_USERNAME || '').trim()
    const token = (process.env.GHCR_TOKEN || '').trim()
    const server = 'ghcr.io'

    if (!username || !token) {
      throw new Error('GHCR credentials are missing.')
    }

    core.info(`Logging into ${server}...`)
    const options = {
      input: Buffer.from(token),
      silent: !showFullOutput
    }

    await exec.exec(
      'docker',
      ['login', server, '-u', username, '--password-stdin'],
      options
    )
    return showFullOutput ? `Logged into ${server}` : ''
  }
}
