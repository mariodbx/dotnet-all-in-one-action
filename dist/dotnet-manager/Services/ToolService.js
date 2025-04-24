import { ef } from './tools/ef.js';
import { csharpier } from './tools/csharpier.js';
export class ToolService {
    dotnetRoot;
    ef;
    csharpier;
    constructor(dotnetRoot, useGlobalDotnetEf) {
        this.dotnetRoot = dotnetRoot;
        this.ef = new ef(this.dotnetRoot, useGlobalDotnetEf);
        this.csharpier = new csharpier(this.dotnetRoot, false);
    }
}
