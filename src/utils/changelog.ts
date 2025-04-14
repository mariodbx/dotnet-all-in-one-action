/**
 * Builds a RegExp from a keyword list.
 *
 * @param {string} keywordsInput - A comma-separated string of keywords.
 * @returns {RegExp} A regular expression matching any of the provided keywords.
 * @throws {Error} If the input is not a valid string.
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
 */
export function categorize(commits: string, pattern: RegExp): string {
  return (
    commits
      .split('\n')
      .filter((line) => pattern.test(line))
      .join('\n') || 'None'
  )
}
