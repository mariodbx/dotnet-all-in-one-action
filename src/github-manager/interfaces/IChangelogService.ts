export interface IChangelogService {
  generateChangelog(
    previousTag: string,
    currentTag: string,
    repo: string,
    owner: string
  ): Promise<string>
}
