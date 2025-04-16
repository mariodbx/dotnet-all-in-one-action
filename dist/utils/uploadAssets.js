// utils/uploadAssets.ts
import * as fs from 'fs';
import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import archiver from 'archiver';
/**
 * Zips the contents of a directory.
 *
 * @param sourceDir The directory to zip.
 * @param outPath The output zip file path.
 */
export async function zipDirectory(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        output.on('close', () => {
            core.info(`Zipped ${sourceDir} -> ${outPath} [${archive.pointer()} total bytes]`);
            resolve();
        });
        archive.on('error', (err) => reject(err));
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}
/**
 * Uploads a list of assets to the given release.
 *
 * @param token GitHub token.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @param releaseId GitHub Release ID.
 * @param assets Array of assets to upload. Each asset must have a name and a file system path.
 */
export async function uploadReleaseAssets(token, owner, repo, releaseId, assets) {
    const octokit = getOctokit(token);
    for (const asset of assets) {
        core.info(`Uploading asset: ${asset.name} from ${asset.path} ...`);
        const fileContent = fs.readFileSync(asset.path).toString();
        const stat = fs.statSync(asset.path);
        await octokit.rest.repos.uploadReleaseAsset({
            owner,
            repo,
            release_id: releaseId,
            name: asset.name,
            data: fileContent,
            headers: {
                'content-length': stat.size,
                'content-type': 'application/octet-stream'
            }
        });
        core.info(`Asset ${asset.name} uploaded successfully.`);
    }
}
