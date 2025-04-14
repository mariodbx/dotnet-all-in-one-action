import * as core from '@actions/core';
/**
 * Checks if a GitHub release with the specified version exists.
 *
 * @example
 * const exists = await releaseExists("user/repo", "1.0.0", token);
 */
export async function releaseExists(repo, version, token) {
    const url = `https://api.github.com/repos/${repo}/releases/tags/v${version}`;
    const response = await fetch(url, {
        headers: { Authorization: `token ${token}` }
    });
    return response.status === 200;
}
/**
 * Creates a new GitHub release using the GitHub API.
 *
 * @example
 * await createRelease("user/repo", "1.0.0", "Changelog...", token);
 */
export async function createRelease(repo, version, changelog, token) {
    const url = `https://api.github.com/repos/${repo}/releases`;
    const payload = {
        tag_name: `v${version}`,
        name: `Release v${version}`,
        body: changelog,
        draft: false,
        prerelease: false
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create release: ${response.status} ${text}`);
    }
    core.info(`Release v${version} created successfully.`);
}
