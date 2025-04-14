import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import * as fs from 'fs';
const ARTIFACT_NAME = 'test-results';
const ARTIFACT_RETENTION_DAYS = 7;
/**
 * Uploads a test result file as an artifact.
 *
 * @param resultFilePath - The full path to the test result file.
 * @param resultFolder - The folder containing the test result file.
 */
export async function uploadTestArtifact(resultFilePath, resultFolder) {
    if (fs.existsSync(resultFilePath)) {
        core.info(`Uploading test result file from ${resultFilePath}...`);
        const artifactClient = new artifact.DefaultArtifactClient();
        try {
            const { id, size } = await artifactClient.uploadArtifact(ARTIFACT_NAME, [resultFilePath], resultFolder, { retentionDays: ARTIFACT_RETENTION_DAYS });
            core.info(`Created artifact with id: ${id} (bytes: ${size})`);
        }
        catch (uploadError) {
            if (uploadError instanceof Error) {
                core.error(`Failed to upload test results: ${uploadError.message}`);
            }
            else {
                core.error('Failed to upload test results due to an unknown error.');
            }
        }
    }
    else {
        core.warning('No test result file found to upload.');
    }
}
