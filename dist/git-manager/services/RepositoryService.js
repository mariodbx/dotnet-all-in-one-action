import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class RepositoryService {
    actor;
    token;
    repo;
    core;
    exec;
    constructor(options, dependencies = {}) {
        this.actor = options.actor;
        this.token = options.token;
        this.repo = options.repo;
        this.core = dependencies.core || core;
        this.exec = dependencies.exec || exec;
        if (!this.actor || !this.token || !this.repo) {
            throw new Error('GITHUB_ACTOR, GITHUB_TOKEN, or GITHUB_REPOSITORY is not defined');
        }
    }
    async clone(localDir) {
        try {
            const repoUrl = `https://${this.actor}:${this.token}@github.com/${this.repo}.git`;
            this.core.info(`Cloning repository ${this.repo} into directory: ${localDir}`);
            await this.exec.exec('git', ['clone', repoUrl, localDir]);
        }
        catch (error) {
            this.core.error(`Failed to clone repository ${this.repo}`);
            throw error;
        }
    }
    async pull(localDir, branch = 'main') {
        try {
            this.core.info(`Pulling latest changes from branch ${branch}`);
            await this.exec.exec('git', ['pull', 'origin', branch], { cwd: localDir });
        }
        catch (error) {
            this.core.error(`Failed to pull latest changes from branch ${branch}`);
            throw error;
        }
    }
    async commitAndPush(localDir, commitMessage) {
        try {
            this.core.info('Committing and pushing changes');
            await this.exec.exec('git', ['add', '.'], { cwd: localDir });
            await this.exec.exec('git', ['commit', '-m', commitMessage], {
                cwd: localDir
            });
            await this.exec.exec('git', ['push', 'origin', 'HEAD'], { cwd: localDir });
        }
        catch (error) {
            this.core.error('Failed to commit and push changes');
            throw error;
        }
    }
}
