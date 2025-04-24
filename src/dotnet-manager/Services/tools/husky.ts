import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'

export class husky {
  private core: typeof core
  private exec: typeof exec
  private allowedKeywords: string[]

  constructor(allowedKeywords: string[], dependencies = { core, exec }) {
    this.allowedKeywords = allowedKeywords
    this.core = dependencies.core
    this.exec = dependencies.exec
  }

  private async checkHuskyFolder(huskyDir: string): Promise<boolean> {
    this.core.info('Checking for existing .husky folder...')
    return fs.existsSync(huskyDir)
  }

  private async createToolManifestIfMissing(
    manifestFile: string
  ): Promise<void> {
    if (!fs.existsSync(manifestFile)) {
      this.core.info('Creating a new dotnet tool manifest…')
      await this.exec.exec('dotnet', ['new', 'tool-manifest'])
    }
  }

  private async installAndInitializeHusky(): Promise<void> {
    this.core.info('Installing Husky.Net tool...')
    await this.exec.exec('dotnet', ['tool', 'install', 'Husky'])

    this.core.info('Initializing Husky.Net...')
    await this.exec.exec('dotnet', ['husky', 'install'])
  }

  /** Ensure Husky.Net is installed (local tool manifest + dotnet tool) */
  async ensureHuskyInstalled(): Promise<void> {
    const dotnetConfigDir = path.join('.config')
    const manifestFile = path.join(dotnetConfigDir, 'dotnet-tools.json')
    const huskyDir = '.husky'

    try {
      const huskyExists = await this.checkHuskyFolder(huskyDir)
      if (!huskyExists) {
        this.core.info('No .husky folder found; installing Husky.Net…')
        await this.createToolManifestIfMissing(manifestFile)
        await this.installAndInitializeHusky()
      } else {
        this.core.info('Husky.Net already initialized.')
      }
    } catch (err) {
      const msg = `Failed to ensure Husky.Net installation: ${(err as Error).message}`
      this.core.error(msg)
      throw new Error(msg)
    }
  }

  async setupCommitMsgHook(): Promise<void> {
    await this.ensureHuskyInstalled()
    try {
      const huskyDir = path.join('.husky')
      const commitMsgHookPath = path.join(huskyDir, 'commit-msg')

      if (!fs.existsSync(huskyDir)) {
        fs.mkdirSync(huskyDir, { recursive: true })
      }

      this.core.info('Creating commit-msg hook...')
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
allowed_words=(${this.allowedKeywords.map((word) => `"${word}"`).join(' ')})

# Check if the cleaned first word is one of the allowed keywords.
word_found=0
for word in "\${allowed_words[@]}"; do
  if [ "first_word" = "word" ]; then
    word_found=1
    break
  fi
done

# If the first word is not an allowed keyword, print an error message.
if [ word_found -eq 0 ]; then
  echo "ERROR: Commit message must start with one of the allowed keywords:"
  echo "  Allowed keywords: ${this.allowedKeywords.join(', ')}"
  exit 1
fi

# If everything is fine, allow the commit.
exit 0
`
      fs.writeFileSync(commitMsgHookPath, hookContent, { mode: 0o755 })
      this.core.info('commit-msg hook created successfully.')
    } catch (error) {
      const errorMessage = `Failed to set up commit-msg hook: ${(error as Error).message}`
      this.core.error(errorMessage)
      throw new Error(errorMessage)
    }
  }
}
