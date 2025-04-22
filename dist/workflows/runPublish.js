import * as core from '@actions/core';
import { DotnetManager } from '../dotnet-manager/DotnetManager.js';
import { Inputs } from '../Inputs.js';
export async function runPublish() {
    const inputs = new Inputs();
    const dotnetManager = new DotnetManager();
    console.log('Publishing binaries...');
    if (inputs.publishLinux) {
        core.info('Publishing .NET binaries for Linux...');
        await dotnetManager.publishProject('Release', './publish/linux', [
            '--self-contained',
            '--runtime',
            'linux-x64'
        ]);
    }
    if (inputs.publishWindows) {
        core.info('Publishing .NET binaries for Windows...');
        await dotnetManager.publishProject('Release', './publish/windows', [
            '--self-contained',
            '--runtime',
            'win-x64'
        ]);
    }
    if (inputs.publishMac) {
        core.info('Publishing .NET binaries for macOS...');
        await dotnetManager.publishProject('Release', './publish/macos', [
            '--self-contained',
            '--runtime',
            'osx-x64'
        ]);
    }
    console.log('Publishing completed.');
}
