import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
export class ArtifactService {
    artifactClient;
    core;
    constructor(dependencies = {}) {
        this.artifactClient = new artifact.DefaultArtifactClient();
        this.core = dependencies.core || core;
    }
    async upload(name, files, rootDir) {
        try {
            this.core.info(`Uploading artifact: ${name}`);
            await this.artifactClient.uploadArtifact(name, files, rootDir);
            this.core.info(`Artifact ${name} uploaded successfully.`);
        }
        catch (error) {
            this.core.error(`Failed to upload artifact: ${name}`);
            throw error;
        }
    }
}
