import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import { IReleaseService } from '../interfaces/IReleaseService.js'
export class ReleaseService implements IReleaseService {
  public async createRelease(
    token: string,
    owner: string,
    repo: string,
    tagName: string,
    releaseName: string,
    body: string,
    draft: boolean = false,
    prerelease: boolean = false
  ): Promise<number> {
    const octokit = getOctokit(token)
    core.info(`Creating release for tag: ${tagName}`)
    const response = await octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name: releaseName,
      body,
      draft,
      prerelease
    })
    core.info(`Release created with ID: ${response.data.id}`)
    return response.data.id
  }
}
