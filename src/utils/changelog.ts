import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getInputOrDefault } from './inputs.js'
import * as fs from 'fs/promises'

/**
 * Builds a RegExp from a keyword list.
 *
 * @param {string} keywordsInput - A comma-separated string of keywords.
 * @returns {RegExp} A regular expression matching any of the provided keywords.
 * @throws {Error} If the input is not a valid string.
 *
 * @example
 * const regex = buildKeywordRegex('fix,bug,patch');
 * console.log(regex.test('fix issue')); // true
 *
 * @remarks
 * This function escapes special characters in the keywords to ensure they are treated literally in the regular expression.
 */
export function buildKeywordRegex(keywordsInput: string): RegExp {
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

/**
 * Categorizes a list of commit messages based on a given regular expression pattern.
 *
 * @param {string} commits - A string containing commit messages separated by newlines.
 * @param {RegExp} pattern - A regular expression used to filter the commit messages.
 * @returns {string} A string containing the filtered commit messages separated by newlines,
 *                   or `'None'` if no messages match the pattern.
 *
 * @example
 * const commits = "fix: issue 1\nfeat: add feature\nfix: issue 2";
 * const regex = /fix/;
 * console.log(categorize(commits, regex));
 * // Output:
 * // fix: issue 1
 * // fix: issue 2
 *
 * @remarks
 * This function is case-insensitive and returns `'None'` if no commit messages match the provided pattern.
 */
export function categorize(commits: string, pattern: RegExp): string {
  return (
    commits
      .split('\n')
      .filter((line) => pattern.test(line))
      .join('\n') || 'None'
  )
}

/**
 * Generates a changelog based on commit messages and categorizes them into sections.
 *
 * @returns {Promise<string>} A promise that resolves to the generated changelog as a string.
 * @throws {Error} If there is an issue running Git commands or writing the changelog file.
 *
 * @example
 * generateChangelog().then((changelog) => console.log(changelog));
 *
 * @remarks
 * This function uses Git to retrieve commit messages since the last tag (or all commits if no tags exist).
 * It categorizes the commits into sections such as "Major Changes", "Minor Changes", etc., based on keywords
 * provided via inputs or defaults. The changelog is written to a file named `changelog.txt`.
 *
 * Inputs:
 * - `major_keywords`: Keywords for major changes (default: 'major').
 * - `minor_keywords`: Keywords for minor changes (default: 'minor').
 * - `patch_keywords`: Keywords for patch/bug fixes (default: 'patch,bug-fix,bug fix').
 * - `hotfix_keywords`: Keywords for hotfixes (default: 'hotfix').
 * - `added_keywords`: Keywords for additions (default: 'added').
 * - `dev_keywords`: Keywords for development changes (default: 'dev').
 *
 * Errors:
 * - If Git commands fail, the function logs the error and continues with an empty commit list.
 * - If writing to the changelog file fails, the error is propagated.
 */
export async function generateChangelog(): Promise<string> {
  let lastTag = ''
  try {
    const output = await exec.getExecOutput('git', [
      'describe',
      '--tags',
      '--abbrev=0'
    ])
    lastTag = output.stdout.trim()
    core.info(`Found last tag: ${lastTag}`)
  } catch {
    core.info('No tags found, using all commits.')
  }

  const range = lastTag ? `${lastTag}..HEAD` : ''
  let commits = ''
  try {
    const output = await exec.getExecOutput('git', [
      'log',
      ...(range ? [range] : []),
      '--no-merges',
      '--pretty=format:%h %s'
    ])
    commits = output.stdout.trim()
  } catch (error) {
    core.error('Failed to retrieve commits: ' + error)
  }

  const changelog = [
    [
      '### Major Changes',
      buildKeywordRegex(getInputOrDefault('major_keywords', 'major'))
    ],
    [
      '### Minor Changes',
      buildKeywordRegex(getInputOrDefault('minor_keywords', 'minor'))
    ],
    [
      '### Patch/Bug Fixes',
      buildKeywordRegex(
        getInputOrDefault('patch_keywords', 'patch,bug-fix,bug fix')
      )
    ],
    [
      '### Hotfixes',
      buildKeywordRegex(getInputOrDefault('hotfix_keywords', 'hotfix'))
    ],
    [
      '### Additions',
      buildKeywordRegex(getInputOrDefault('added_keywords', 'added'))
    ],
    [
      '### Dev Changes',
      buildKeywordRegex(getInputOrDefault('dev_keywords', 'dev'))
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
