import * as fs from 'fs/promises';
import { execWithOutput } from './exec.js';
export async function findCsprojFile(csprojDepth, csprojName) {
    const findCmd = `find . -maxdepth ${csprojDepth} -name "${csprojName}" | head -n 1`;
    const csprojPath = await execWithOutput('bash', ['-c', findCmd]);
    return csprojPath;
}
export async function readCsprojFile(csprojPath) {
    return await fs.readFile(csprojPath, 'utf8');
}
export async function updateCsprojFile(csprojPath, content) {
    await fs.writeFile(csprojPath, content, 'utf8');
}
export function extractVersion(csprojContent) {
    const versionRegex = /<Version>([^<]+)<\/Version>/;
    const match = csprojContent.match(versionRegex);
    if (!match) {
        throw new Error('No version found in csproj file.');
    }
    return match[1].trim();
}
export function updateVersionContent(csprojContent, newVersion) {
    const versionRegex = /<Version>([^<]+)<\/Version>/;
    return csprojContent.replace(versionRegex, `<Version>${newVersion}</Version>`);
}
export function extractVersionFromCsproj(content) {
    const match = content.match(/<Version>([^<]+)<\/Version>/);
    if (!match)
        throw new Error('No version found in the .csproj file.');
    return match[1].trim();
}
