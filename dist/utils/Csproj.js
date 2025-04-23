import * as fs from 'fs/promises';
import * as path from 'path';
export class Csproj {
    constructor() {
        // Prevent instantiation
    }
    static async findFiles(dir, depth, csprojName) {
        if (depth < 0)
            return [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...(await this.findFiles(fullPath, depth - 1, csprojName)));
            }
            else if (entry.isFile() && entry.name === csprojName) {
                files.push(fullPath);
            }
        }
        return files;
    }
    static async findCsproj(csprojDepth, csprojName) {
        try {
            const searchDir = path.resolve('.');
            const paths = await this.findFiles(searchDir, csprojDepth, csprojName);
            if (paths.length === 0) {
                throw new Error(`.csproj file named "${csprojName}" not found within depth ${csprojDepth}`);
            }
            return paths[0];
        }
        catch (error) {
            throw new Error(`Failed to find .csproj file: ${error.message}`);
        }
    }
    static async readCsproj(csprojPath) {
        try {
            return await fs.readFile(csprojPath, 'utf8');
        }
        catch (error) {
            throw new Error(`Failed to read .csproj file at ${csprojPath}: ${error.message}`);
        }
    }
    static async updateCsproj(csprojPath, content) {
        try {
            await fs.writeFile(csprojPath, content, 'utf8');
        }
        catch (error) {
            throw new Error(`Failed to update .csproj file at ${csprojPath}: ${error.message}`);
        }
    }
    static extractVersion(csprojContent) {
        try {
            const versionMatch = csprojContent.match(/<Version>(.*?)<\/Version>/);
            if (!versionMatch) {
                throw new Error('Version tag not found in .csproj content');
            }
            return versionMatch[1];
        }
        catch (error) {
            throw new Error(`Failed to extract version: ${error.message}`);
        }
    }
    static updateVersion(csprojContent, newVersion) {
        try {
            if (!/<Version>.*?<\/Version>/.test(csprojContent)) {
                throw new Error('Version tag not found in .csproj content');
            }
            return csprojContent.replace(/<Version>.*?<\/Version>/, `<Version>${newVersion}</Version>`);
        }
        catch (error) {
            throw new Error(`Failed to update version: ${error.message}`);
        }
    }
    static extractVersionSuffix(csprojContent) {
        try {
            const suffixRegex = /<VersionSuffix>([^<]+)<\/VersionSuffix>/;
            const match = csprojContent.match(suffixRegex);
            if (!match) {
                throw new Error('No version suffix found in .csproj content');
            }
            return match[1].trim();
        }
        catch (error) {
            throw new Error(`Failed to extract version suffix: ${error.message}`);
        }
    }
    static updateVersionSuffixContent(csprojContent, newSuffix) {
        try {
            const suffixRegex = /<VersionSuffix>([^<]+)<\/VersionSuffix>/;
            if (!suffixRegex.test(csprojContent)) {
                throw new Error('Version suffix tag not found in .csproj content');
            }
            return csprojContent.replace(suffixRegex, `<VersionSuffix>${newSuffix}</VersionSuffix>`);
        }
        catch (error) {
            throw new Error(`Failed to update version suffix: ${error.message}`);
        }
    }
    static removeVersionSuffix(csprojContent) {
        try {
            const suffixRegex = /<VersionSuffix>[^<]+<\/VersionSuffix>\s*/;
            if (!suffixRegex.test(csprojContent)) {
                throw new Error('Version suffix tag not found in .csproj content');
            }
            return csprojContent.replace(suffixRegex, '');
        }
        catch (error) {
            throw new Error(`Failed to remove version suffix: ${error.message}`);
        }
    }
    static createVersionIfNotExists(csprojContent, defaultVersion) {
        try {
            if (!/<Version>.*?<\/Version>/.test(csprojContent)) {
                const insertPosition = csprojContent.indexOf('</PropertyGroup>');
                if (insertPosition === -1) {
                    throw new Error('No <PropertyGroup> found to insert <Version>');
                }
                return (csprojContent.slice(0, insertPosition) +
                    `  <Version>${defaultVersion}</Version>\n` +
                    csprojContent.slice(insertPosition));
            }
            return csprojContent;
        }
        catch (error) {
            throw new Error(`Failed to create version tag: ${error.message}`);
        }
    }
    static createVersionSuffixIfNotExists(csprojContent, defaultSuffix) {
        try {
            if (!/<VersionSuffix>.*?<\/VersionSuffix>/.test(csprojContent)) {
                const insertPosition = csprojContent.indexOf('</PropertyGroup>');
                if (insertPosition === -1) {
                    throw new Error('No <PropertyGroup> found to insert <VersionSuffix>');
                }
                return (csprojContent.slice(0, insertPosition) +
                    `  <VersionSuffix>${defaultSuffix}</VersionSuffix>\n` +
                    csprojContent.slice(insertPosition));
            }
            return csprojContent;
        }
        catch (error) {
            throw new Error(`Failed to create version suffix tag: ${error.message}`);
        }
    }
}
// // Example usage
// (async () => {
//   try {
//     const csprojName = 'example.csproj'
//     const csprojDepth = 3
//     // Find the .csproj file
//     const csprojPath = await Csproj.findCsproj(csprojDepth, csprojName)
//     console.log(`Found .csproj file at: ${csprojPath}`)
//     // Read the .csproj file
//     const csprojContent = await Csproj.readCsproj(csprojPath)
