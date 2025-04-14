/**
 * Parses a version string into its components: major, minor, patch, and build.
 *
 * @param {string} version - The version string to parse. It must follow the format "major.minor.patch.build".
 *                  - `major`: The major version number (required).
 *                  - `minor`: The minor version number (required).
 *                  - `patch`: The patch version number (required).
 *                  - `build`: The build version number (optional, defaults to 0 if omitted).
 * @returns {{ major: number, minor: number, patch: number, build: number }} An object containing the parsed version components:
 *          - `major`: The major version number as a positive integer.
 *          - `minor`: The minor version number as a positive integer.
 *          - `patch`: The patch version number as a positive integer.
 *          - `build`: The build version number as a positive integer (defaults to 0 if not provided).
 * @throws {Error} Will throw an error if the version string is not in a valid format or contains non-numeric values.
 *
 * @example
 * ```typescript
 * const version: { major: number; minor: number; patch: number; build: number } = parseVersion("1.2.3.4");
 * console.log(version); // { major: 1, minor: 2, patch: 3, build: 4 }
 *
 * const versionWithDefaultBuild: { major: number; minor: number; patch: number; build: number } = parseVersion("1.2.3");
 * console.log(versionWithDefaultBuild); // { major: 1, minor: 2, patch: 3, build: 0 }
 * ```
 *
 * @remarks
 * - This function assumes the version string is in the format "major.minor.patch.build".
 * - If the build number is omitted, it defaults to 0.
 * - The function does not support version strings with fewer than three components (e.g., "1.2").
 * - Input validation ensures all components are numeric and positive integers.
 */
export function parseVersion(version) {
    const parts = version.split('.').map((s) => parseInt(s, 10));
    if (parts.some((n) => isNaN(n))) {
        throw new Error(`Invalid version format: ${version}`);
    }
    const [major, minor, patch, build = 0] = parts;
    return { major, minor, patch, build };
}
/**
 * Bumps a version object based on the specified bump type.
 *
 * @param {{ major: number; minor: number; patch: number; build: number }} current - The current version object containing:
 *                  - `major`: The major version number as a positive integer.
 *                  - `minor`: The minor version number as a positive integer.
 *                  - `patch`: The patch version number as a positive integer.
 *                  - `build`: The build version number as a positive integer.
 * @param {string} bumpType - The type of version bump to apply. Valid values are:
 *                   - `"major"`: Increments the major version by 1 and resets minor and patch to 0.
 *                   - `"minor"`: Increments the minor version by 1 and resets patch to 0.
 *                   - `"patch"`: Increments the patch version by 1.
 * @returns {string} The new version string in the format "major.minor.patch.build".
 *          - The `build` number is always incremented by 1, regardless of the bump type.
 * @throws {Error} Will throw an error if the `bumpType` is invalid or not one of the allowed values.
 *
 * @example
 * ```typescript
 * const currentVersion: { major: number; minor: number; patch: number; build: number } = { major: 1, minor: 2, patch: 3, build: 4 };
 * const newVersionMajor: string = bumpVersion(currentVersion, "major");
 * console.log(newVersionMajor); // "2.0.0.5"
 *
 * const newVersionMinor: string = bumpVersion(currentVersion, "minor");
 * console.log(newVersionMinor); // "1.3.0.5"
 *
 * const newVersionPatch: string = bumpVersion(currentVersion, "patch");
 * console.log(newVersionPatch); // "1.2.4.5"
 * ```
 *
 * @remarks
 * - The `build` number is incremented by 1 for every bump type. This ensures that every version string is unique.
 * - Invalid `bumpType` values will result in an error being thrown.
 * - Use this function to programmatically manage versioning in CI/CD pipelines or software releases.
 */
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
