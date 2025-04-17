import * as core from '@actions/core';
import * as exec from '@actions/exec';
export class ACRRegistry {
    qualifyImageName(image) {
        const server = process.env.ACR_SERVER;
        if (!server) {
            throw new Error('ACR_SERVER environment variable is not set.');
        }
        if (image.startsWith(server)) {
            return image;
        }
        return `${server}/${image}`;
    }
    async login(showFullOutput) {
        const username = (process.env.ACR_USERNAME || '').trim();
        const token = (process.env.ACR_PASSWORD || '').trim();
        const server = process.env.ACR_SERVER;
        if (!username || !token || !server) {
            throw new Error('ACR credentials are missing.');
        }
        core.info(`Logging into ${server}...`);
        const options = {
            input: Buffer.from(token),
            silent: !showFullOutput
        };
        await exec.exec('docker', ['login', server, '-u', username, '--password-stdin'], options);
        return showFullOutput ? `Logged into ${server}` : '';
    }
}
