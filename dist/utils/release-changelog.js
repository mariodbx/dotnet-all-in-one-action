import * as core from '@actions/core';
import * as fs from 'fs/promises';
import { runCommand } from './command.js';
/**
 * Builds a RegExp from a keyword list.
 *
 * @param {string} keywordsInput - A comma-separated string of keywords.
 * @returns {RegExp} A regular expression matching any of the provided keywords.
 * @throws {Error} If the input is not a valid string.
 *
 * @example
 * ```typescript
 * const regex: RegExp = buildKeywordRegex("fix,bug,patch");
 * console.log(regex); // Output: /(fix|bug|patch)/i
 * ```
 *
 * @remarks
 * - The function escapes special characters in the keywords to ensure they are treated as literals.
 * - If the input string is empty or contains only whitespace, the function returns a RegExp that matches nothing (`/^$/`).
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
 * @param {string} commits - A string containing commit messages separated by newlines.
 * @param {RegExp} pattern - A regular expression used to filter the commit messages.
 * @returns {string} A string containing the filtered commit messages separated by newlines,
 *                   or `'None'` if no messages match the pattern.
 * @throws {Error} If the input parameters are invalid.
 *
 * @example
 * ```typescript
 * const commits: string = `
 *   feat: add new user authentication
 *   fix: resolve login bug
 *   docs: update README
 *   chore: update dependencies
 * `;
 *
 * const pattern: RegExp = /^feat:/;
 * const result: string = categorize(commits, pattern);
 * console.log(result); // Output: feat: add new user authentication
 * ```
 *
 * @remarks
 * - The function trims and filters empty lines from the input.
 * - If no lines match the pattern, the function returns `'None'`.
 */
function categorize(commits, pattern) {
    return (commits
        .split('\n')
        .filter((line) => pattern.test(line))
        .join('\n') || 'None');
}
/**
 * Generates a changelog based on Git commit history and categorizes changes
 * into predefined sections such as Major Changes, Minor Changes, Patch/Bug Fixes, etc.
 *
 * @async
 * @function
 * @param {string} [major_keywords="major"] - Keywords for major changes.
 * @param {string} [minor_keywords="minor"] - Keywords for minor changes.
 * @param {string} [patch_keywords="patch,bug-fix,bug fix"] - Keywords for patch or bug fixes.
 * @param {string} [hotfix_keywords="hotfix"] - Keywords for hotfixes.
 * @param {string} [added_keywords="added"] - Keywords for additions.
 * @param {string} [dev_keywords="dev"] - Keywords for development changes.
 * @returns {Promise<string>} A promise that resolves to the generated changelog as a string.
 * @throws {Error} If there is an issue executing Git commands or writing the changelog file.
 *
 * @example
 * ```typescript
 * import { generateChangelog } from './release-changelog';
 *
 * async function run(): Promise<void> {
 *   try {
 *     const changelog: string = await generateChangelog();
 *     console.log('Generated Changelog:', changelog);
 *   } catch (error) {
 *     console.error('Error generating changelog:', error);
 *   }
 * }
 * ```
 *
 * @remarks
 * - The function relies on the `git` command-line tool being available in the environment.
 * - If no tags are found in the repository, all commits are included in the changelog.
 * - The changelog is categorized into sections based on the provided or default keywords.
 * - The changelog is saved to a file named `changelog.txt` in the current working directory.
 */
export async function generateChangelog() {
    let lastTag = '';
    try {
        lastTag = await runCommand('git', ['describe', '--tags', '--abbrev=0'], {}, true);
        core.info(`Found last tag: ${lastTag}`);
    }
    catch {
        core.info('No tags found, using all commits.');
    }
    const range = lastTag ? `${lastTag}..HEAD` : '';
    const commits = await runCommand('git', ['log', ...(range ? [range] : []), '--no-merges', '--pretty=format:%h %s'], {}, true);
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
/**
 * Retrieves an input value for the GitHub Action, or returns a default value if not provided.
 *
 * @param {string} name - The name of the input.
 * @param {string} defaultValue - The default value to return if the input is not provided.
 * @returns {string} The input value or the default value.
 * @throws {Error} If the input name is invalid.
 *
 * @example
 * ```typescript
 * const input: string = getActionInput('major_keywords', 'major');
 * console.log(input); // Output: 'major' (or the value provided in the GitHub Action input)
 * ```
 *
 * @remarks
 * - This function is designed for use in GitHub Actions workflows.
 * - It uses the `@actions/core` library to retrieve inputs.
 */
function getActionInput(name, defaultValue) {
    return core.getInput(name) || defaultValue;
}
