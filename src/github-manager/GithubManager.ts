import * as core from '@actions/core'
import * as fs from 'fs/promises'
import { exec } from '@actions/exec'
import { IGithubManager } from './interfaces/IGithubManager.js'

export class GithubManager implements IGithubManager {
  private token: string

  constructor(token: string) {
    this.token = token
  }

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
    core.info('Creating GitHub release...')
    const url = `https://api.github.com/repos/${owner}/${repo}/releases`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: tagName,
        name: releaseName,
        body,
        draft,
        prerelease
      })
    })

    if (!response.ok) {
      throw new Error(
        `Failed to create release: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    core.info(`Release created with ID ${data.id}.`)
    return data.id
  }

  public async uploadAssets(
    token: string,
    owner: string,
    repo: string,
    releaseId: number,
    assets: { name: string; path: string }[]
  ): Promise<void> {
    core.info('Uploading assets to GitHub release...')
    for (const asset of assets) {
      const url = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${asset.name}`
      const fileContent = await fs.readFile(asset.path)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileContent.length.toString()
        },
        body: fileContent
      })

      if (!response.ok) {
        throw new Error(
          `Failed to upload asset ${asset.name}: ${response.status} ${response.statusText}`
        )
      }

      core.info(`Asset ${asset.name} uploaded successfully.`)
    }
  }

  public async generateChangelog(
    previousTag: string,
    currentTag: string,
    repo: string,
    owner: string
  ): Promise<string> {
    core.info('Generating changelog...')
    const url = `https://api.github.com/repos/${owner}/${repo}/compare/${previousTag}...${currentTag}`
    const response = await fetch(url, {
      headers: { Authorization: `token ${this.token}` }
    })

    if (!response.ok) {
      throw new Error(
        `Failed to generate changelog: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    const changelog = data.commits
      .map((commit: any) => `- ${commit.commit.message} (${commit.sha})`)
      .join('\n')

    return `## Changelog\n\n${changelog}`
  }
}
