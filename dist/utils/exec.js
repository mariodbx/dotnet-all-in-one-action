import * as exec from '@actions/exec';
/**
 * Executes a command and returns stdout as string.
 *
 * @example
 * const result = await execWithOutput('git', ['log', '-1']);
 */
export async function execWithOutput(command, args) {
    let output = '';
    const options = {
        listeners: {
            stdout: (data) => (output += data.toString())
        }
    };
    await exec.exec(command, args, options);
    return output.trim();
}
