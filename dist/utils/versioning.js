export function parseVersion(version) {
    const parts = version.split('.').map((s) => parseInt(s, 10));
    if (parts.some((n) => isNaN(n))) {
        throw new Error(`Invalid version format: ${version}`);
    }
    const [major, minor, patch, build = 0] = parts;
    return { major, minor, patch, build };
}
export function bumpVersion(current, bumpType) {
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
    // Build number always increments.
    build += 1;
    return `${major}.${minor}.${patch}.${build}`;
}
