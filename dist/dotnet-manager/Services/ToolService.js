import { ef } from './tools/ef.js';
export class ToolService {
    dotnetRoot;
    ef;
    constructor(dotnetRoot, useGlobalDotnetEf) {
        this.dotnetRoot = dotnetRoot;
        this.ef = new ef(this.dotnetRoot, useGlobalDotnetEf);
    }
}
