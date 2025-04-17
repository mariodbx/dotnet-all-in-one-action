import * as fs from 'fs'
import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import { IAssetService } from '../interfaces/IAssetService.js'

export class AssetService implements IAssetService {
  public async uploadAssets(
    token: string,
    owner: string,
    repo: string,
    releaseId: number,
    assets: { name: string; path: string }[]
  ): Promise<void> {
    const octokit = getOctokit(token)
    for (const asset of assets) {
      core.info(`Uploading asset: ${asset.name} from ${asset.path}...`)
      const fileContent = fs.readFileSync(asset.path).toString('base64')
      const stat = fs.statSync(asset.path)
      await octokit.rest.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: releaseId,
        name: asset.name,
        data: fileContent,
        headers: {
          'content-length': stat.size,
          'content-type': 'application/octet-stream'
        }
      })
      core.info(`Asset ${asset.name} uploaded successfully.`)
    }
  }
}
