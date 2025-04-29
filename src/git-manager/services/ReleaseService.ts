import * as core from '@actions/core'
import * as fs from 'fs/promises'
import { Inputs } from '../../utils/Inputs.js'
import * as exec from '@actions/exec'

export class ReleaseService {
  private core: typeof core
  private token: string

  constructor(dependencies: { core?: typeof core } = {}) {
    this.core = dependencies.core || core
    this.token = process.env.GITHUB_TOKEN || ''
    if (!this.token) {
      throw new Error('GITHUB_TOKEN is not defined in the environment.')
    }
  }

  extractVersionFromCommit(commitMessage: string): string | null {
    const versionRegex = /v(\d+\.\d+\.\d+)/ // Example: v1.2.3
    const match = commitMessage.match(versionRegex)
    return match ? match[1] : null
  }

  async releaseExists(repo: string, version: string): Promise<boolean> {
    const url = `https://api.github.com/repos/${repo}/releases/tags/v${version}`
    const response = await fetch(url, {
      headers: { Authorization: `token ${this.token}` }
    })

    if (response.status === 401) {
      throw new Error(
        'Authentication failed. Please ensure that the GITHUB_TOKEN is valid and has the necessary permissions.'
      )
    }

    return response.status === 200
  }

  async createRelease(
    repo: string,
    version: string,
    changelog: string
  ): Promise<void> {
    const url = `https://api.github.com/repos/${repo}/releases`
    const payload = {
      tag_name: `v${version}`,
      name: `Release v${version}`,
      body: changelog,
      draft: false,
      prerelease: false
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `token ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 401) {
      throw new Error(
        'Authentication failed. Please ensure that the GITHUB_TOKEN is valid and has the necessary permissions.'
      )
    }

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to create release: ${response.status} ${text}`)
    }

    this.core.info(`Release v${version} created successfully.`)
  }

  private buildKeywordRegex(keywordsInput: string): RegExp {
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    if (keywords.length === 0) return /^$/

    const pattern = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    return new RegExp(`(${pattern})`, 'i')
  }

  private categorize(commits: string, pattern: RegExp): string {
    return (
      commits
        .split('\n')
        .filter((line) => pattern.test(line))
        .join('\n') || 'None'
    )
  }

  async generateChangelog(inputs: Inputs): Promise<string> {
    let lastTag = ''
    try {
      lastTag = await exec
        .getExecOutput('git', ['describe', '--tags', '--abbrev=0'])
        .then((output) => output.stdout.trim())
      this.core.info(`Found last tag: ${lastTag}`)
    } catch {
      this.core.info('No tags found, using all commits.')
    }

    const range = lastTag ? `${lastTag}..HEAD` : ''
    const commits = await exec
      .getExecOutput('git', [
        'log',
        ...(range ? [range] : []),
        '--no-merges',
        '--pretty=format:%h %s'
      ])
      .then((output) => output.stdout)

    const changelog = [
      [
        '### Major Changes',
        this.buildKeywordRegex(inputs.majorKeywords.join(','))
      ],
      [
        '### Minor Changes',
        this.buildKeywordRegex(inputs.minorKeywords.join(','))
      ],
      [
        '### Patch/Bug Fixes',
        this.buildKeywordRegex(inputs.patchKeywords.join(','))
      ],
      ['### Hotfixes', this.buildKeywordRegex(inputs.hotfixKeywords.join(','))],
      ['### Additions', this.buildKeywordRegex(inputs.addedKeywords.join(','))],
      ['### Dev Changes', this.buildKeywordRegex(inputs.devKeywords.join(','))]
    ]
      .map(
        ([label, regex]) =>
          `${label}\n${this.categorize(commits, regex as RegExp)}`
      )
      .join('\n\n')

    await fs.writeFile('changelog.txt', changelog, 'utf8')
    this.core.info('Generated changelog:\n' + changelog)
    return changelog
  }
}
