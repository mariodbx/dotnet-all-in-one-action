export class TestService {
    deps;
    dotnetRoot;
    projectDirectoryRoot;
    testFolder;
    uploadResults;
    resultsFolder;
    resultsFormat;
    constructor(deps, dotnetRoot, projectDirectoryRoot, testFolder, uploadResults, resultsFolder, resultsFormat) {
        this.deps = deps;
        this.dotnetRoot = dotnetRoot;
        this.projectDirectoryRoot = projectDirectoryRoot;
        this.testFolder = testFolder;
        this.uploadResults = uploadResults;
        this.resultsFolder = resultsFolder;
        this.resultsFormat = resultsFormat;
    }
    getLoggerFlag() {
        return this.uploadResults ? ['--logger'] : [];
    }
    getLoggerArg() {
        if (!this.uploadResults)
            return [];
        return [
            `${this.resultsFormat};LogFileName=${this.resultsFolder}.${this.resultsFormat}`
        ];
    }
    async runTests(additionalArgs = []) {
        const args = [
            'test',
            this.testFolder,
            ...this.getLoggerFlag(),
            ...this.getLoggerArg(),
            ...additionalArgs
        ];
        try {
            await this.deps.exec.exec('dotnet', args, {
                env: {
                    ...process.env,
                    DOTNET_ROOT: this.dotnetRoot,
                    HOME: process.env.HOME || '/home/node' // Ensure HOME is set
                },
                cwd: this.projectDirectoryRoot
            });
            this.deps.core.info(`✔ Tests passed. Results in ${this.resultsFolder}.${this.resultsFormat}`);
        }
        catch (err) {
            const msg = err.message;
            this.deps.core.error(msg);
            throw new Error(msg);
        }
    }
}
