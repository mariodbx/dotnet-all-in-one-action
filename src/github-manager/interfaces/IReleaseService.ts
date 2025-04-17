export interface IReleaseService {
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
}
