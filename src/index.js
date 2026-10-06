/**
 * Public entry point for the flatten-dict library.
 *
 * Only the documented surface is re-exported so consumers cannot accidentally
 * depend on internal helpers that may change between versions.
 */

export { flatten } from './core.js';
export { unflatten } from './core.js';
