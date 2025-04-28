// src/services/tools/HuskyService.ts
import type { IDependencies } from '../../../models/Dependencies.js'
import * as fs from 'fs'
import * as path from 'path'

export class Husky {
  constructor(
    private readonly deps: IDependencies,
    private readonly projectDirectoryRoot: string,
    private readonly allowedKeywords: string[]
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
        const errorMessage = `Failed to create dotnet tool manifest: ${(error as Error).message}`
        this.deps.core.error(errorMessage)
        throw new Error(errorMessage)
      }
    } else {
      this.deps.core.info('✔ Dotnet tool manifest already exists.')
    }
  }

  private async installHusky(): Promise<void> {
    await this.ensureToolManifest() // Ensure the tool manifest exists without overwriting it

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
    const huskyDir = '.husky'
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
    const dir = path.join(this.projectDirectoryRoot, '.husky')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const hook = path.join(dir, 'commit-msg')
    const content = `#!/bin/sh
commit_msg_file="$1"
if [ ! -f "$commit_msg_file" ]; then
  echo "Commit-msg file missing"; exit 1
fi
first_line=$(sed -n '/./{p;q;}' "$commit_msg_file")
first_word=$(echo "$first_line" | awk '{print tolower($1)}' | sed 's/[^a-z].*//')
allowed=(${this.allowedKeywords.map((w) => `"${w}"`).join(' ')})
found=0
for w in "\${allowed[@]}"; do
  [ "$first_word" = "$w" ] && found=1 && break
done
if [ $found -eq 0 ]; then
  echo "ERROR: Must start with: ${this.allowedKeywords.join(', ')}"
  exit 1
fi
exit 0
`
    fs.writeFileSync(hook, content, { mode: 0o755 })
    this.deps.core.info('✔ commit-msg hook created.')
  }
}
