import * as core from '@actions/core';
/**
 * Reads a GitHub Action input with fallback.
 *
 * @example
 * const token = getActionInput('token', '');
 */
export function getActionInput(name, fallback = '') {
    return core.getInput(name) || fallback;
}
export function getInputOrDefault(name, defaultValue) {
    return core.getInput(name) || defaultValue;
}
export function getInputOrDefaultBoolean(name, defaultValue) {
    const value = core.getInput(name);
    return value ? value.toLowerCase() === 'true' : defaultValue;
}
