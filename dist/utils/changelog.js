import { execWithOutput } from './exec.js';
import { getActionInput } from './input-utils.js';
import * as core from '@actions/core';
import * as fs from 'fs/promises';
/**
 * Builds a RegExp from a keyword list.
 *
 * @example
 * const regex = buildKeywordRegex("fix,bug,patch");
 */
function buildKeywordRegex(keywordsInput) {
    const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    if (keywords.length === 0)
        return /^$/;
    const pattern = keywords
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');
    return new RegExp(`(${pattern})`, 'i');
}
/**
 * Categorizes a list of commit messages based on a given regular expression pattern.
 *
 * This function takes a string of commit messages separated by newlines and filters
 * them based on whether they match the provided regular expression pattern. The matching
 * commit messages are then joined into a single string separated by newlines. If no
 * commit messages match the pattern, the function returns the string `'None'`.
 *
 * @param commits - A string containing commit messages separated by newlines.
 * @param pattern - A regular expression used to filter the commit messages.
 * @returns A string containing the filtered commit messages separated by newlines,
 *          or `'None'` if no messages match the pattern.
 *
 * @example
 * ```typescript
 * const commits = `
 *   feat: add new user authentication
 *   fix: resolve login bug
 *   docs: update README
 *   chore: update dependencies
 * `;
 *
 * const pattern = /^feat:/;
 * const result = categorize(commits, pattern);
 * console.log(result);
 * // Output:
 * // feat: add new user authentication
 *
 * const noMatchPattern = /^test:/;
 * const noMatchResult = categorize(commits, noMatchPattern);
 * console.log(noMatchResult);
 * // Output:
 * // None
 * ```
 */
function categorize(commits, pattern) {
    return (commits
        .split('\n')
        .filter((line) => pattern.test(line))
        .join('\n') || 'None');
}
/**
 * Generates a categorized changelog from commit messages.
 *
 * @example
 * const log = await generateChangelog();
 */
/**
 * Generates a changelog based on Git commit history and categorizes changes
 * into predefined sections such as Major Changes, Minor Changes, Patch/Bug Fixes, etc.
 * The changelog is written to a file named `changelog.txt` and also returned as a string.
 *
 * The function uses Git commands to determine the range of commits to include in the changelog.
 * If no tags are found in the repository, all commits are included. Commits are categorized
 * based on keywords provided via inputs or default values.
 *
 * @returns {Promise<string>} A promise that resolves to the generated changelog as a string.
 *
 * @example
 * // Example usage in a GitHub Actions workflow:
 * import { generateChangelog } from './changelog';
 *
 * async function run() {
 *   try {
 *     const changelog = await generateChangelog();
 *     console.log('Generated Changelog:', changelog);
 *   } catch (error) {
 *     console.error('Error generating changelog:', error);
 *   }
 * }
 *
 * @remarks
 * - The function relies on the `git` command-line tool being available in the environment.
 * - Keywords for categorization can be customized using the following inputs:
 *   - `major_keywords`: Keywords for major changes (default: "major").
 *   - `minor_keywords`: Keywords for minor changes (default: "minor").
 *   - `patch_keywords`: Keywords for patch/bug fixes (default: "patch,bug-fix,bug fix").
 *   - `hotfix_keywords`: Keywords for hotfixes (default: "hotfix").
 *   - `added_keywords`: Keywords for additions (default: "added").
 *   - `dev_keywords`: Keywords for development changes (default: "dev").
 *
 * @throws {Error} If there is an issue executing Git commands or writing the changelog file.
 */
export async function generateChangelog() {
    let lastTag = '';
    try {
        lastTag = await execWithOutput('git', ['describe', '--tags', '--abbrev=0']);
        core.info(`Found last tag: ${lastTag}`);
    }
    catch {
        core.info('No tags found, using all commits.');
    }
    const range = lastTag ? `${lastTag}..HEAD` : '';
    const commits = await execWithOutput('git', [
        'log',
        ...(range ? [range] : []),
        '--no-merges',
        '--pretty=format:%h %s'
    ]);
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
            buildKeywordRegex(getActionInput('patch_keywords', 'patch,bug-fix,bug fix'))
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
        .map(([label, regex]) => `${label}\n${categorize(commits, regex)}`)
        .join('\n\n');
    await fs.writeFile('changelog.txt', changelog, 'utf8');
    core.info('Generated changelog:\n' + changelog);
    return changelog;
}
