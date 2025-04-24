import { ef } from './tools/ef.js';
import { csharpier } from './tools/csharpier.js';
import { husky } from './tools/husky.js';
export class ToolService {
    dotnetRoot;
    ef;
    csharpier;
    husky;
    constructor(dotnetRoot, allowedKeywords) {
        this.dotnetRoot = dotnetRoot;
        this.ef = new ef(this.dotnetRoot);
        this.csharpier = new csharpier(this.dotnetRoot);
        this.husky = new husky(allowedKeywords);
    }
}
