import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { IRegistry } from '../interfaces/IRegistry.js'

export class DockerHubRegistry implements IRegistry {
  qualifyImageName(image: string): string {
    const username = process.env.DOCKERHUB_USERNAME || ''
    if (image.includes('/') || !username) {
      return image
    }
    return `${username}/${image}`
  }

  async login(showFullOutput: boolean): Promise<string> {
    const username = (process.env.DOCKERHUB_USERNAME || '').trim()
    const token = (process.env.DOCKERHUB_TOKEN || '').trim()
    const server = 'docker.io'

    if (!username || !token) {
      throw new Error('DockerHub credentials are missing.')
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
