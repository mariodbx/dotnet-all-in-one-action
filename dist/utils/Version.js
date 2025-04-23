import * as exec from '@actions/exec';
export class Version {
    constructor() { }
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
    /**
     * Extracts the bump type from a commit message.
     * @param {string} commitMessage - The commit message to analyze.
     * @returns {string} The bump type ('major', 'minor', 'patch', or '').
     */
    static extractBumpType(commitMessage) {
        const lowerCaseMessage = commitMessage.toLowerCase();
        if (lowerCaseMessage.includes('major')) {
            return 'major';
        }
        else if (lowerCaseMessage.includes('minor')) {
            return 'minor';
        }
        else if (lowerCaseMessage.includes('patch')) {
            return 'patch';
        }
        return '';
    }
    /**
     * Validates if the provided bump type is valid.
     * @param {string} bumpType - The bump type to validate.
     * @returns {boolean} True if valid, otherwise false.
     */
    static isValidBumpType(bumpType) {
        return ['major', 'minor', 'patch'].includes(bumpType);
    }
}
