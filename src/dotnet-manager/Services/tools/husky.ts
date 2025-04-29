// src/services/tools/HuskyService.ts
import type { IDependencies } from '../../../models/Dependencies.js'
import * as fs from 'fs'
import * as path from 'path'

export class Husky {
  /**
   * @param deps               your tooling deps (core/exec)
   * @param projectDirectory   root of your repo
   * @param keywordGroups      e.g. { Major: ['breaking','overhaul'], Minor: ['feature','enhancement'], … }
   */
  constructor(
    private readonly deps: IDependencies,
    private readonly projectDirectoryRoot: string,
    private readonly keywordGroups: Record<string, string[]>
  ) {}

  private async ensureToolManifest(): Promise<void> {
    const manifest = path.join(
      this.projectDirectoryRoot,
      '.config',
      'dotnet-tools.json'
    )
    if (!fs.existsSync(manifest)) {
      this.deps.core.info('Creating dotnet tool manifest…')
      try {
        await this.deps.exec.exec('dotnet', ['new', 'tool-manifest'], {
          cwd: this.projectDirectoryRoot
        })
      } catch (error) {
        const msg = `Failed to create dotnet tool manifest: ${(error as Error).message}`
        this.deps.core.error(msg)
        throw new Error(msg)
      }
    } else {
      this.deps.core.info('✔ Dotnet tool manifest already exists.')
    }
  }

  private async installHusky(): Promise<void> {
    await this.ensureToolManifest()
    this.deps.core.info('Installing Husky.Net…')
    await this.deps.exec.exec('dotnet', ['tool', 'install', 'Husky'], {
      cwd: this.projectDirectoryRoot
    })
    this.deps.core.info('Initializing Husky.Net…')
    await this.deps.exec.exec('dotnet', ['husky', 'install'], {
      cwd: this.projectDirectoryRoot
    })
  }

  async ensureInstalled(): Promise<void> {
    const huskyDir = path.join(this.projectDirectoryRoot, '.husky')
    if (!fs.existsSync(huskyDir)) {
      this.deps.core.info('No .husky folder; setting up Husky.Net…')
      await this.ensureToolManifest()
      await this.installHusky()
    } else {
      this.deps.core.info('✔ Husky.Net already initialized.')
    }
  }

  async setupCommitMsgHook(): Promise<void> {
    await this.ensureInstalled()

    const huskyDir = path.join(this.projectDirectoryRoot, '.husky')
    if (!fs.existsSync(huskyDir)) {
      fs.mkdirSync(huskyDir, { recursive: true })
    }
    const hookPath = path.join(huskyDir, 'commit-msg')

    // 1) Flatten all keywords:
    const allKeywords = Object.values(this.keywordGroups).flat()
    // 2) Build Bash array literal:
    const bashArray = allKeywords.map((w) => `"${w}"`).join(' ')
    // (we’ll reuse keywordGroups to build comments & echo blocks)

    // 3) Comment block: "#   Major:    breaking, overhaul, major"
    const commentBlock = Object.entries(this.keywordGroups)
      .map(([group, words]) => `#   ${group}:    ${words.join(', ')}`)
      .join('\n')

    // 4) Echo block: "  Major:    breaking, overhaul, major"
    const echoBlock = Object.entries(this.keywordGroups)
      .map(([group, words]) => `  ${group}:    ${words.join(', ')}`)
      .join('\n')

    const content = `#!/bin/sh
# .husky/commit-msg
# This script enforces that the commit message begins with one of the allowed keywords.
# Allowed keywords:
${commentBlock}

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
# This means if the word is "Major:HEHE", only "major" is extracted.
first_word=$(echo "$raw_first_word" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-zA-Z].*//')

# Define the allowed keywords.
allowed_words=(${bashArray})

# Check if the cleaned first word is one of the allowed keywords.
word_found=0
for word in "\${allowed_words[@]}"; do
  if [ "$first_word" = "$word" ]; then
    word_found=1
    break
  fi
done

# If the first word is not an allowed keyword, print an error message.
if [ $word_found -eq 0 ]; then
  echo "ERROR: Commit message must start with one of the allowed keywords:"
${echoBlock}
  exit 1
fi

# If everything is fine, allow the commit.
exit 0
`

    fs.writeFileSync(hookPath, content, { mode: 0o755 })
    this.deps.core.info('✔ .husky/commit-msg hook created.')
  }
}
