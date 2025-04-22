import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs/promises';
import { getOctokit } from '@actions/github';
import * as artifact from '@actions/artifact';
export class GitManager {
    actor;
    token;
    repo;
    exec;
    core;
    constructor(options = {}, dependencies = { exec, core }) {
        this.actor = options.actor || process.env['GITHUB_ACTOR'] || '';
        this.token = options.token || process.env['GITHUB_TOKEN'] || '';
        this.repo = options.repo || process.env['GITHUB_REPOSITORY'] || '';
        this.exec = dependencies.exec;
        this.core = dependencies.core;
        if (!this.actor) {
            throw new Error('GITHUB_ACTOR is not defined');
        }
        if (!this.token) {
            throw new Error('GITHUB_TOKEN is not defined');
        }
        if (!this.repo) {
            throw new Error('GITHUB_REPOSITORY is not defined');
        }
    }
    async initialize() {
        try {
            await this.configureGit();
        }
        catch (error) {
            this.core.error(`Failed to initialize GitManager: ${error.message}`);
            throw error;
        }
    }
    //#region Git Command Execution
    async execGitCommand(args, cwd, execOptions) {
        try {
            const options = cwd ? { cwd, ...execOptions } : execOptions;
            await this.exec.exec('git', args, options);
        }
        catch (error) {
            const errorMessage = `Git command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    // private async getExecGitCommandOutput(
    //   args: string[],
    //   cwd?: string,
    //   execOptions?: exec.ExecOptions
    // ): Promise<string> {
    //   let stdout = ''
    //   const options: exec.ExecOptions = {
    //     ...execOptions,
    //     cwd,
    //     listeners: {
    //       stdout: (data: Buffer) => {
    //         stdout += data.toString()
    //       }
    //     }
    //   }
    //   try {
    //     await this.exec.exec('git', args, options)
    //     return stdout.trim()
    //   } catch (error) {
    //     const errorMessage = `Git command failed: ${args.join(' ')} in directory: ${cwd || 'current working directory'}`
    //     this.core.error(errorMessage)
    //     throw new Error(
    //       `${errorMessage}. Original error: ${(error as Error).message}`
    //     )
    //   }
    // }
    //#endregion
    //#region Git Configuration
    async configureGit() {
        try {
            const email = `${this.actor}@users.noreply.github.com`;
            await this.execGitCommand(['config', '--global', 'user.name', this.actor]);
            await this.execGitCommand(['config', '--global', 'user.email', email]);
            this.core.info(`Configured Git for user: ${this.actor}`);
        }
        catch (error) {
            const errorMessage = 'Failed to configure Git user settings';
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    //#endregion
    //#region Repository Operations
    async cloneRepo(localDir) {
        try {
            const repoUrl = `https://${this.actor}:${this.token}@github.com/${this.repo}.git`;
            this.core.info(`Cloning repository ${this.repo} into directory: ${localDir}`);
            await this.execGitCommand(['clone', repoUrl, localDir]);
        }
        catch (error) {
            const errorMessage = `Failed to clone repository ${this.repo} into directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async pullRepo(localDir, branch = 'main') {
        try {
            this.core.info(`Pulling latest changes from branch ${branch}`);
            await this.execGitCommand(['pull', 'origin', branch], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to pull latest changes from branch ${branch} in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async pull() {
        try {
            this.core.info(`Pulling...`);
            await this.execGitCommand(['pull']);
        }
        catch (error) {
            const errorMessage = `Failed to pull...`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async commitAndPush(localDir, commitMessage) {
        try {
            this.core.info('Committing and pushing changes');
            await this.execGitCommand(['add', '.'], localDir);
            await this.execGitCommand(['commit', '-m', commitMessage], localDir);
            await this.execGitCommand(['push', 'origin', 'HEAD'], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to commit and push changes in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async createAndCheckoutBranch(localDir, branchName) {
        try {
            this.core.info(`Creating and checking out branch ${branchName}`);
            await this.execGitCommand(['checkout', '-b', branchName], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to create and checkout branch ${branchName} in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async checkoutBranch(localDir, branchName) {
        try {
            this.core.info(`Checking out branch ${branchName}`);
            await this.execGitCommand(['checkout', branchName], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to checkout branch ${branchName} in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async mergeBranch(localDir, branchToMerge, conflictStrategy) {
        try {
            this.core.info(`Merging branch ${branchToMerge}`);
            const args = ['merge', branchToMerge];
            if (conflictStrategy) {
                args.push(`-X${conflictStrategy}`);
            }
            await this.execGitCommand(args, localDir);
        }
        catch (error) {
            const errorMessage = `Failed to merge branch ${branchToMerge} in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async pushBranch(localDir, branchName) {
        try {
            this.core.info(`Pushing branch ${branchName}`);
            await this.execGitCommand(['push', '-u', 'origin', branchName], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to push branch ${branchName} from directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async cleanRepo(localDir) {
        try {
            this.core.info(`Cleaning repository in directory: ${localDir}`);
            await this.execGitCommand(['clean', '-fdx'], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to clean repository in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    async restoreRepo(localDir) {
        try {
            this.core.info(`Restoring repository in directory: ${localDir}`);
            await this.execGitCommand(['restore', '.'], localDir);
        }
        catch (error) {
            const errorMessage = `Failed to restore repository in directory: ${localDir}`;
            this.core.error(errorMessage);
            throw new Error(`${errorMessage}. Original error: ${error.message}`);
        }
    }
    //#endregion
    //#region Utility Methods
    async getLatestCommitMessage() {
        let stdout = '';
        const options = {
            listeners: {
                stdout: (data) => {
                    stdout += data.toString();
                }
            }
        };
        await this.execGitCommand(['log', '-1', '--pretty=%B'], undefined, options);
        return stdout.trim();
    }
    async updateVersion(newVersion, csprojPath, commitUser, commitEmail, commitMessagePrefix) {
        await this.execGitCommand(['config', 'user.name', commitUser]);
        await this.execGitCommand(['config', 'user.email', commitEmail]);
        await this.execGitCommand(['add', csprojPath]);
        const commitMessage = `${commitMessagePrefix} Bump version to ${newVersion}`;
        await this.execGitCommand(['commit', '-m', commitMessage]);
        await this.execGitCommand(['push', 'origin', 'HEAD']);
        this.core.info(`Version updated to ${newVersion} and pushed to remote.`);
    }
    async createRelease(repo, tag, changelog) {
        const [owner, repoName] = repo.split('/');
        const octokit = getOctokit(this.token);
        this.core.info(`Creating release for tag ${tag}...`);
        const response = await octokit.rest.repos.createRelease({
            owner,
            repo: repoName,
            tag_name: tag,
            name: tag,
            body: changelog,
            draft: false,
            prerelease: false
        });
        this.core.info(`Release created with ID ${response.data.id}.`);
        return response;
    }
    async uploadAssets(owner, repo, releaseId, assets) {
        const octokit = getOctokit(this.token);
        for (const asset of assets) {
            try {
                this.core.info(`Uploading asset: ${asset.name} from ${asset.path}...`);
                const fileContent = await fs.readFile(asset.path);
                const stat = await fs.stat(asset.path);
                await octokit.rest.repos.uploadReleaseAsset({
                    owner,
                    repo,
                    release_id: releaseId,
                    name: asset.name,
                    data: fileContent.toString(),
                    headers: {
                        'content-length': stat.size,
                        'content-type': 'application/octet-stream'
                    }
                });
                this.core.info(`Asset ${asset.name} uploaded successfully.`);
            }
            catch (error) {
                const errorMessage = `Failed to upload asset ${asset.name} from ${asset.path}`;
                this.core.error(errorMessage);
                throw new Error(`${errorMessage}. Original error: ${error.message}`);
            }
        }
    }
    async generateChangelog(inputs) {
        let lastTag = '';
        try {
            const { stdout } = await exec.getExecOutput('git', [
                'describe',
                '--tags',
                '--abbrev=0'
            ]);
            lastTag = stdout.trim();
            this.core.info(`Found last tag: ${lastTag}`);
        }
        catch {
            this.core.info('No tags found, using all commits.');
        }
        const range = lastTag ? `${lastTag}..HEAD` : '';
        const { stdout: commits } = await exec.getExecOutput('git', [
            'log',
            ...(range ? [range] : []),
            '--no-merges',
            '--pretty=format:%h %s'
        ]);
        const changelog = [
            ['### Major Changes', this.buildKeywordRegex(inputs.majorKeywords)],
            ['### Minor Changes', this.buildKeywordRegex(inputs.minorKeywords)],
            ['### Patch/Bug Fixes', this.buildKeywordRegex(inputs.patchKeywords)],
            ['### Hotfixes', this.buildKeywordRegex(inputs.hotfixKeywords)],
            ['### Additions', this.buildKeywordRegex(inputs.addedKeywords)],
            ['### Dev Changes', this.buildKeywordRegex(inputs.devKeywords)]
        ]
            .map(([label, regex]) => {
            const categorizedCommits = this.categorize(commits, regex);
            return `${label}\n${categorizedCommits}`;
        })
            .join('\n\n');
        await fs.writeFile('changelog.txt', changelog, 'utf8');
        this.core.info('Generated changelog:\n' + changelog);
        return changelog;
    }
    buildKeywordRegex(keywordsInput) {
        const keywords = keywordsInput
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
        if (keywords.length === 0)
            return /.*/; // Match all if no keywords provided.
        const pattern = keywords
            .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');
        return new RegExp(`\\b(${pattern})\\b`, 'i'); // Ensure whole-word matching.
    }
    categorize(commits, pattern) {
        const filteredCommits = commits
            .split('\n')
            .filter((line) => pattern.test(line))
            .join('\n');
        return filteredCommits || 'None';
    }
    async releaseExists(repo, version) {
        const url = `https://api.github.com/repos/${repo}/releases/tags/v${version}`;
        const response = await fetch(url, {
            headers: { Authorization: `token ${this.token}` }
        });
        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to check release existence: ${response.status} ${response.statusText}`);
        }
        return response.status === 200;
    }
    extractVersionFromCommit(commitMessage) {
        const versionRegex = /version\s(\d+\.\d+\.\d+)/i;
        const match = commitMessage.match(versionRegex);
        return match ? match[1] : null;
    }
    //#endregion
    //#region Artifact Management
    async uploadArtifact(artifactName, resultFilePath, resultFolder, retentionDays) {
        if (await fs
            .access(resultFilePath)
            .then(() => true)
            .catch(() => false)) {
            this.core.info(`Uploading artifact from ${resultFilePath}...`);
            const artifactClient = new artifact.DefaultArtifactClient();
            try {
                const { id, size } = await artifactClient.uploadArtifact(artifactName, [resultFilePath], resultFolder, { retentionDays });
                this.core.info(`Created artifact with id: ${id} (bytes: ${size})`);
            }
            catch (uploadError) {
                if (uploadError instanceof Error) {
                    this.core.error(`Failed to upload artifact: ${uploadError.message}`);
                }
                else {
                    this.core.error('Failed to upload artifact due to an unknown error.');
                }
            }
        }
        else {
            this.core.info('No file found to upload as an artifact.');
        }
    }
    async uploadTestArtifact(resultFilePath, resultFolder) {
        const artifactName = 'test-results';
        const retentionDays = 7;
        await this.uploadArtifact(artifactName, resultFilePath, resultFolder, retentionDays);
    }
}
