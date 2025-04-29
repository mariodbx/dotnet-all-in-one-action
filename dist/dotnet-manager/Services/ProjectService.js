export class ProjectService {
    deps;
    dotnetRoot;
    constructor(deps, dotnetRoot) {
        this.deps = deps;
        this.dotnetRoot = dotnetRoot;
    }
    async publish(mainProject, configuration, outputDir, additionalFlags = []) {
        this.deps.core.info(`Publishing .NET project (${configuration}) → ${outputDir}`);
        try {
            await this.deps.exec.exec('dotnet', [
                'publish',
                mainProject,
                '-c',
                configuration,
                '-o',
                outputDir,
                ...additionalFlags
            ], {
                env: {
                    DOTNET_ROOT: this.dotnetRoot,
                    HOME: process.env.HOME || '/home/node' // Ensure HOME is set
                },
                cwd: this.deps.core.getInput('projectDirectoryRoot')
            });
            this.deps.core.info('✔ Project published.');
        }
        catch (err) {
            const msg = `Publish failed (${configuration}): ${err.message}`;
            this.deps.core.error(msg);
            throw new Error(msg);
        }
    }
    async restorePackages() {
        this.deps.core.info('Restoring NuGet packages…');
        try {
            await this.deps.exec.exec('dotnet', ['restore'], {
                env: { DOTNET_ROOT: this.dotnetRoot }
            });
            this.deps.core.info('✔ Packages restored.');
        }
        catch (err) {
            const msg = `Restore failed: ${err.message}`;
            this.deps.core.error(msg);
            throw new Error(msg);
        }
    }
    async build(configuration) {
        this.deps.core.info(`Building project (${configuration})…`);
        try {
            await this.deps.exec.exec('dotnet', ['build', '-c', configuration], {
                env: { DOTNET_ROOT: this.dotnetRoot }
            });
            this.deps.core.info('✔ Build succeeded.');
        }
        catch (err) {
            const msg = `Build failed: ${err.message}`;
            this.deps.core.error(msg);
            throw new Error(msg);
        }
    }
}
