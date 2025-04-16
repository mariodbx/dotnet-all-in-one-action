import * as core from '@actions/core';
import { publishDotnetProject } from '../utils/dotnet.js';
import { getInputs } from '../utils/inputs.js';
export async function runPublish() {
    const inputs = getInputs();
    console.log('Publishing binaries...');
    if (inputs.publishLinux) {
        core.info('Publishing .NET binaries for Linux...');
        await publishDotnetProject('Release', './publish/linux', [
            '--self-contained',
            '--runtime',
            'linux-x64'
        ]);
    }
    if (inputs.publishWindows) {
        core.info('Publishing .NET binaries for Windows...');
        await publishDotnetProject('Release', './publish/windows', [
            '--self-contained',
            '--runtime',
            'win-x64'
        ]);
    }
    if (inputs.publishMac) {
        core.info('Publishing .NET binaries for macOS...');
        await publishDotnetProject('Release', './publish/macos', [
            '--self-contained',
            '--runtime',
            'osx-x64'
        ]);
    }
    console.log('Publishing completed.');
}
