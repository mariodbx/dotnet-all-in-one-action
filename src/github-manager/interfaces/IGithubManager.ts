export interface IGithubManager {
  createRelease(
    token: string,
    owner: string,
    repo: string,
    tagName: string,
    releaseName: string,
    body: string,
    draft?: boolean,
    prerelease?: boolean
  ): Promise<number>

  uploadAssets(
    token: string,
    owner: string,
    repo: string,
    releaseId: number,
    assets: { name: string; path: string }[]
  ): Promise<void>

  generateChangelog(
    previousTag: string,
    currentTag: string,
    repo: string,
    owner: string
  ): Promise<string>
}
