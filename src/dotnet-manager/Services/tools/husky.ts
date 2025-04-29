// src/services/tools/HuskyService.ts
import type { IDependencies } from '../../../models/Dependencies.js'
import * as fs from 'fs'
import * as path from 'path'

export class Husky {
  /**
   * @param deps               your tooling deps (core/exec)
   * @param projectDirectoryRoot   root of your repo
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

  /** Generate `.husky/accepted-words.sh` */
  private async ensureAcceptedWordsScript(): Promise<void> {
    const huskyDir = path.join(this.projectDirectoryRoot, '.husky')
    const scriptPath = path.join(huskyDir, 'accepted-words.sh')

    const allKeywords = Object.values(this.keywordGroups).flat()
    const commentBlock = Object.entries(this.keywordGroups)
      .map(([group, words]) => `#   ${group}:    ${words.join(', ')}`)
      .join('\n')
    const echoBlock = Object.entries(this.keywordGroups)
      .map(([group, words]) => `  ${group}:    ${words.join(', ')}`)
      .join('\n')
    const bashArray = allKeywords.map((w) => `"${w}"`).join(' ')

    const content = `#!/bin/sh
# accepted-words.sh
# This script enforces that the commit message begins with one of the allowed keywords.
# Allowed keywords:
${commentBlock}

# The commit message file is passed as the first parameter.
commit_msg_file="$1"

if [ ! -f "$commit_msg_file" ]; then
  echo "Error: Commit message file not found!"
  exit 1
fi

first_line=$(sed -n '/./{p;q;}' "$commit_msg_file")
raw_first_word=$(echo "$first_line" | awk '{print $1}')
first_word=$(echo "$raw_first_word" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-zA-Z].*//')

allowed_words=(${bashArray})

word_found=0
for word in "\${allowed_words[@]}"; do
  if [ "$first_word" = "$word" ]; then
    word_found=1
    break
  fi
done

if [ $word_found -eq 0 ]; then
  echo "ERROR: Commit message must start with one of the allowed keywords:"
${echoBlock}
  exit 1
fi

exit 0
`

    fs.writeFileSync(scriptPath, content, { mode: 0o755 })
    this.deps.core.info('✔ .husky/accepted-words.sh created.')
  }

  /**
   * Create/update `.husky/commit-msg` to call accepted-words.sh.
   * Won't rewrite if it already references accepted-words.sh.
   */
  async setupCommitMsgHook(): Promise<void> {
    await this.ensureInstalled()

    const huskyDir = path.join(this.projectDirectoryRoot, '.husky')
    if (!fs.existsSync(huskyDir)) {
      fs.mkdirSync(huskyDir, { recursive: true })
    }
    const hookPath = path.join(huskyDir, 'commit-msg')

    await this.ensureAcceptedWordsScript()

    // NOTE: no backslashes before $ here, so ESLint no-useless-escape won't complain
    const hookContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

bash "$(dirname "$0")/accepted-words.sh" "$1"
`

    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf8')
      if (existing.includes('accepted-words.sh')) {
        this.deps.core.info(
          '✔ .husky/commit-msg already references accepted-words.sh'
        )
        return
      }
    }

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 })
    this.deps.core.info(
      '✔ .husky/commit-msg hook updated to call accepted-words.sh'
    )
  }
}
