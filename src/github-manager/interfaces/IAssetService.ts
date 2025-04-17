export interface IAssetService {
  uploadAssets(
    token: string,
    owner: string,
    repo: string,
    releaseId: number,
    assets: { name: string; path: string }[]
  ): Promise<void>
}
