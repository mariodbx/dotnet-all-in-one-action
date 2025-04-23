import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { RepositoryService } from './services/RepositoryService.js';
import { ArtifactService } from './services/ArtifactService.js';
export class GitManager {
    actor;
    token;
    repository;
    repo;
    artifact;
    constructor(options = {}, dependencies = {}) {
        this.actor = options.actor || process.env['GITHUB_ACTOR'] || '';
        this.token = options.token || process.env['GITHUB_TOKEN'] || '';
        this.repository = options.repo || process.env['GITHUB_REPOSITORY'] || '';
        if (!this.actor || !this.token || !this.repository) {
            throw new Error('GITHUB_ACTOR, GITHUB_TOKEN, or GITHUB_REPOSITORY is not defined');
        }
        // Automatically initialize Git configuration
        this.initialize().catch((error) => {
            core.error(`Failed to initialize GitManager: ${error.message}`);
            throw error;
        });
        this.repo = new RepositoryService({ actor: this.actor, token: this.token, repo: this.repository }, dependencies);
        this.artifact = new ArtifactService(dependencies);
    }
    async initialize() {
        const email = `${this.actor}@users.noreply.github.com`;
        await exec.exec('git', ['config', '--global', 'user.name', this.actor]);
        await exec.exec('git', ['config', '--global', 'user.email', email]);
        core.info(`Configured Git for user: ${this.actor}`);
    }
    async getLatestCommitMessage() {
        let stdout = '';
        const options = {
            listeners: {
                stdout: (data) => {
                    stdout += data.toString();
                }
            }
        };
        await exec.exec('git', ['log', '-1', '--pretty=%B'], {
            listeners: options.listeners
        });
        return stdout.trim();
    }
    async updateVersion(newVersion, csprojPath, commitUser, commitEmail, commitMessagePrefix) {
        await exec.exec('git', ['config', 'user.name', commitUser]);
        await exec.exec('git', ['config', 'user.email', commitEmail]);
        await exec.exec('git', ['add', csprojPath]);
        const commitMessage = `${commitMessagePrefix} Bump version to ${newVersion}`;
        await exec.exec('git', ['commit', '-m', commitMessage]);
        await exec.exec('git', ['push', 'origin', 'HEAD']);
        core.info(`Version updated to ${newVersion} and pushed to remote.`);
    }
}
