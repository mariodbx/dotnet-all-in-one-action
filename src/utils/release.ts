import * as core from '@actions/core'
import * as fs from 'fs/promises'
import * as exec from '@actions/exec'
import { buildKeywordRegex, categorize } from './changelog.js'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods' // Import for specific type

/**
 * Checks if a GitHub release with the specified version exists.
 *
 * @param {string} repo - The GitHub repository in the format "owner/repo".
 * @param {string} version - The version of the release to check for (e.g., "1.0.0").
 * @param {string} token - A GitHub personal access token with repository access.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the release exists, otherwise `false`.
 * @throws {Error} If the request to the GitHub API fails.
 *
 * @example
 * const token: string = "your-github-token";
 * const exists: boolean = await releaseExists("user/repo", "1.0.0", token);
 * if (exists) {
 *   console.log("Release exists.");
 * } else {
 *   console.log("Release does not exist.");
 * }
 *
 * @remarks
 * This function uses the GitHub API to check for the existence of a release
 * with the specified version. Ensure that the provided token has the necessary
 * permissions to access the repository. The function throws an error if the
 * API request fails for any reason.
 */
export async function releaseExists(
  repo: string,
  version: string,
  token: string
): Promise<boolean> {
  const url = `https://api.github.com/repos/${repo}/releases/tags/v${version}`
  const response = await fetch(url, {
    headers: { Authorization: `token ${token}` }
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Failed to check release existence: ${response.status} ${response.statusText}`
    )
  }

  return response.status === 200
}

/**
 * Creates a new GitHub release using the GitHub API.
 *
 * @param {string} repo - The GitHub repository in the format "owner/repo".
 * @param {string} version - The version of the release to create (e.g., "1.0.0").
 * @param {string} changelog - The changelog or description for the release.
 * @param {string} token - A GitHub personal access token with repository access.
 * @returns {Promise<void>} A promise that resolves when the release is successfully created.
 * @throws {Error} If the release creation fails or the API request encounters an error.
 *
 * @example
 * const token: string = "your-github-token";
 * await createRelease("user/repo", "1.0.0", "Changelog...", token);
 * console.log("Release created successfully.");
 *
 * @remarks
 * This function creates a new release in the specified GitHub repository.
 * The release is created with the provided version, changelog, and metadata.
 * Ensure that the provided token has the necessary permissions to create releases.
 * If the release creation fails, an error is thrown with details about the failure.
 * The function uses the GitHub API and requires a valid token with repository
 * write access.
 */
import { getOctokit } from '@actions/github'

export async function createRelease(
  repo: string,
  tag: string,
  changelog: string,
  token: string
): Promise<RestEndpointMethodTypes['repos']['createRelease']['response']> {
  // Use specific type
  const [owner, repoName] = repo.split('/')
  const octokit = getOctokit(token)
  core.info(`Creating release for tag ${tag}...`)
  const response = await octokit.rest.repos.createRelease({
    owner,
    repo: repoName,
    tag_name: tag,
    name: tag,
    body: changelog,
    draft: false,
    prerelease: false
  })
  core.info(`Release created with ID ${response.data.id}.`)
  return response
}

export async function generateChangelog(): Promise<string> {
  let lastTag = ''
  try {
    const { stdout } = await exec.getExecOutput('git', [
      'describe',
      '--tags',
      '--abbrev=0'
    ])
    lastTag = stdout.trim()
    core.info(`Found last tag: ${lastTag}`)
  } catch {
    core.info('No tags found, using all commits.')
  }

  const range = lastTag ? `${lastTag}..HEAD` : ''
  const { stdout: commits } = await exec.getExecOutput('git', [
    'log',
    ...(range ? [range] : []),
    '--no-merges',
    '--pretty=format:%h %s'
  ])

  const changelog = [
    [
      '### Major Changes',
      buildKeywordRegex(getActionInput('major_keywords', 'major'))
    ],
    [
      '### Minor Changes',
      buildKeywordRegex(getActionInput('minor_keywords', 'minor'))
    ],
    [
      '### Patch/Bug Fixes',
      buildKeywordRegex(
        getActionInput('patch_keywords', 'patch,bug-fix,bug fix')
      )
    ],
    [
      '### Hotfixes',
      buildKeywordRegex(getActionInput('hotfix_keywords', 'hotfix'))
    ],
    [
      '### Additions',
      buildKeywordRegex(getActionInput('added_keywords', 'added'))
    ],
    [
      '### Dev Changes',
      buildKeywordRegex(getActionInput('dev_keywords', 'dev'))
    ]
  ]
    .map(
      ([label, regex]) => `${label}\n${categorize(commits, regex as RegExp)}`
    )
    .join('\n\n')

  await fs.writeFile('changelog.txt', changelog, 'utf8')
  core.info('Generated changelog:\n' + changelog)
  return changelog
}

function getActionInput(name: string, defaultValue: string): string {
  return core.getInput(name) || defaultValue
}
