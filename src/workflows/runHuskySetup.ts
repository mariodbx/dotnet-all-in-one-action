import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import { Inputs } from '../utils/Inputs.js'

export async function runHuskySetup(): Promise<void> {
  try {
    const inputs = new Inputs()

    const allowedWords = [
      ...inputs.majorKeywords.split(',').map((word) => word.trim()),
      ...inputs.minorKeywords.split(',').map((word) => word.trim()),
      ...inputs.patchKeywords.split(',').map((word) => word.trim()),
      ...inputs.hotfixKeywords.split(',').map((word) => word.trim()),
      ...inputs.addedKeywords.split(',').map((word) => word.trim()),
      ...inputs.devKeywords.split(',').map((word) => word.trim())
    ]

    core.info('Installing Husky locally...')
    await exec.exec('npm', ['install', 'husky', '--save-dev'])

    core.info('Initializing Husky...')
    await exec.exec('npx', ['husky', 'install'])

    const huskyDir = path.join('.husky')
    const commitMsgHookPath = path.join(huskyDir, 'commit-msg')

    if (!fs.existsSync(huskyDir)) {
      fs.mkdirSync(huskyDir, { recursive: true })
    }

    core.info('Creating commit-msg hook...')
    const hookContent = `#!/bin/sh
# .husky/commit-msg
# This script enforces that the commit message begins with one of the allowed keywords.

# The commit message file is passed as the first parameter.
commit_msg_file="$1"

# Check if the commit message file exists.
if [ ! -f "$commit_msg_file" ]; then
  echo "Error: Commit message file not found!"
  exit 1
fi

# Extract the first non-empty line from the commit message.
first_line=$(sed -n '/./{p;q;}' "$commit_msg_file")

# Extract the first word.
raw_first_word=$(echo "$first_line" | awk '{print $1}')

# Convert to lowercase and remove everything to the right of the first non-alphanumeric character.
first_word=$(echo "$raw_first_word" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-zA-Z].*//')

# Define the allowed keywords.
allowed_words=(${allowedWords.map((word) => `"${word}"`).join(' ')})

# Check if the cleaned first word is one of the allowed keywords.
word_found=0
for word in "\${allowed_words[@]}"; do
  if [ "\$first_word" = "\$word" ]; then
    word_found=1
    break
  fi
done

# If the first word is not an allowed keyword, print an error message.
if [ \$word_found -eq 0 ]; then
  echo "ERROR: Commit message must start with one of the allowed keywords:"
  echo "  Allowed keywords: ${allowedWords.join(', ')}"
  exit 1
fi

# If everything is fine, allow the commit.
exit 0
`
    fs.writeFileSync(commitMsgHookPath, hookContent, { mode: 0o755 })
    core.info('commit-msg hook created successfully.')

    core.info('Husky setup completed.')
  } catch (error) {
    core.error('An error occurred during Husky setup.')
    if (error instanceof Error) {
      core.error(`Error: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
