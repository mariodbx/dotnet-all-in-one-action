import { EF } from './tools/ef.js';
import { CSharpier } from './tools/csharpier.js';
import { Husky } from './tools/husky.js';
export class ToolService {
    deps;
    ef;
    csharpier;
    husky;
    constructor(deps, dotnetRoot, projectDirectoryRoot, allowedKeywords) {
        this.deps = deps;
        // If any tool needs core/exec, you can pass deps too
        this.ef = new EF(deps, dotnetRoot, projectDirectoryRoot);
        this.csharpier = new CSharpier(deps, dotnetRoot, projectDirectoryRoot);
        this.husky = new Husky(deps, projectDirectoryRoot, allowedKeywords);
    }
}
