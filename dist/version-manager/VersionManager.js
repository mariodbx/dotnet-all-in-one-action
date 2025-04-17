import { CsprojService } from '../dotnet-manager/services/CsprojService.js';
import * as exec from '@actions/exec';
export class VersionManager {
    static csprojService = new CsprojService();
    /**
     * Parses a version string into its components.
     * @param {string} version - The version string to parse.
     * @returns {{ major: number, minor: number, patch: number, build: number }}
     */
    static parseVersion(version) {
        const parts = version.split('.').map((s) => parseInt(s, 10));
        if (parts.some((n) => isNaN(n))) {
            throw new Error(`Invalid version format: ${version}`);
        }
        const [major, minor, patch, build = 0] = parts;
        return { major, minor, patch, build };
    }
    /**
     * Bumps a version object based on the specified bump type.
     * @param {{ major: number; minor: number; patch: number; build: number }} current - The current version object.
     * @param {string} bumpType - The type of version bump to apply.
     * @returns {string} The new version string.
     */
    static bumpVersion(current, bumpType) {
        let { major, minor, patch, build } = current;
        if (bumpType === 'major') {
            major += 1;
            minor = 0;
            patch = 0;
        }
        else if (bumpType === 'minor') {
            minor += 1;
            patch = 0;
        }
        else if (bumpType === 'patch') {
            patch += 1;
        }
        else {
            throw new Error(`Invalid bump type: ${bumpType}`);
        }
        build += 1;
        return `${major}.${minor}.${patch}.${build}`;
    }
    /**
     * Bumps a version object with an optional pre-release suffix.
     * @param {{ major: number; minor: number; patch: number; build: number }} current - The current version object.
     * @param {string} bumpType - The type of version bump to apply.
     * @param {string | null} suffix - The optional pre-release suffix.
     * @returns {string} The new version string.
     */
    static bumpVersionWithSuffix(current, bumpType, suffix) {
        let { major, minor, patch, build } = current;
        if (bumpType === 'major') {
            major += 1;
            minor = 0;
            patch = 0;
        }
        else if (bumpType === 'minor') {
            minor += 1;
            patch = 0;
        }
        else if (bumpType === 'patch') {
            patch += 1;
        }
        else {
            throw new Error(`Invalid bump type: ${bumpType}`);
        }
        build += 1;
        const baseVersion = `${major}.${minor}.${patch}.${build}`;
        return suffix ? `${baseVersion}-${suffix}` : baseVersion;
    }
    /**
     * Updates the version suffix in a `.csproj` file.
     * @param {string} csprojPath - The path to the `.csproj` file.
     * @param {string | null} newSuffix - The new version suffix to set.
     * @returns {Promise<void>}
     */
    static async updateVersionSuffixFromCsproj(csprojPath, newSuffix) {
        const csprojContent = await this.csprojService.readCsproj(csprojPath);
        const updatedContent = newSuffix
            ? this.csprojService.updateVersionSuffixContent(csprojContent, newSuffix)
            : csprojContent.replace(/<VersionSuffix>[^<]+<\/VersionSuffix>\s*/, '');
        await this.csprojService.updateCsproj(csprojPath, updatedContent);
    }
    /**
     * Retrieves the last Git tag.
     * @returns {Promise<string>} The last Git tag.
     */
    static async getLastGitTag() {
        const { stdout } = await exec.getExecOutput('git', [
            'describe',
            '--tags',
            '--abbrev=0'
        ]);
        return stdout.trim();
    }
    /**
     * Retrieves the commit log between two Git references.
     * @param {string | null} range - The range of commits to retrieve.
     * @returns {Promise<string>} The commit log.
     */
    static async getCommitLog(range) {
        const { stdout: commits } = await exec.getExecOutput('git', [
            'log',
            ...(range ? [range] : []),
            '--no-merges',
            '--pretty=format:%h %s'
        ]);
        return commits;
    }
    extractBumpType(commitMessage) {
        const match = commitMessage.match(/bump:\s*(\w+)/i);
        return match ? match[1].toLowerCase() : '';
    }
    isValidBumpType(bumpType) {
        return ['major', 'minor', 'patch'].includes(bumpType);
    }
    bumpVersion(currentVersion, bumpType) {
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        switch (bumpType) {
            case 'major':
                return `${major + 1}.0.0`;
            case 'minor':
                return `${major}.${minor + 1}.0`;
            case 'patch':
                return `${major}.${minor}.${patch + 1}`;
            default:
                throw new Error(`Invalid bump type: ${bumpType}`);
        }
    }
}
