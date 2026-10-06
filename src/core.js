/**
 * flatten-dict — turn nested plain objects into flat keys and back.
 *
 * Scope and decisions (read before relying on this):
 *
 * 1. Only plain objects (`{}` created via `{}` or `Object.create(null)`) are
 *    traversed. Arrays are treated as leaves, so `{ a: [1, 2] }` becomes
 *    `{ "a": [1, 2] }`, not `{ "a.0": 1, "a.1": 2 }`. Most callers that reach
 *    for a flattener are dealing with config-like records where arrays are
 *    opaque values, and mixing array indices into the key space produces keys
 *    that are easy to mistype and hard to round-trip when a list grows.
 *
 * 2. The separator is a caller-supplied string. No escaping is performed: if
 *    a leaf key already contains the separator, unflatten will split on it and
 *    produce a different structure. This is stated in the README rather than
 *    silently worked around, because every escaping scheme either bloats keys
 *    or breaks round-tripping for some input. Pick a separator that does not
 *    appear in your keys.
 *
 * 3. null and undefined are preserved as leaves, not treated as "no value".
 *    Flattening `{ a: null }` yields `{ "a": null }`, and unflattening that
 *    yields `{ a: null }`. This matches what JSON.parse would give and avoids
 *    silently dropping data.
 */

/**
 * True for objects we should recurse into.
 *
 * `Object.create(null)` has a null prototype but is still a dictionary, so we
 * check the prototype tag rather than using `instanceof Object`, which would
 * reject null-prototype objects.
 *
 * @param {unknown} v
 * @returns {boolean}
 */
function isPlainObject(v) {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
}

/**
 * Flatten a nested plain object into a single-level object whose keys are the
 * dot-joined (or otherwise separated) paths to each leaf.
 *
 * @param {Record<string, unknown>} input
 * @param {{ separator?: string }} [options]
 * @param {string} [options.separator='.'] - String placed between path segments.
 * @returns {Record<string, unknown>}
 */
export function flatten(input, options = {}) {
  const separator = typeof options === 'string' ? options : options.separator ?? '.';
  if (typeof separator !== 'string') {
    throw new TypeError('separator must be a string');
  }
  if (!isPlainObject(input)) {
    throw new TypeError('flatten expects a plain object');
  }

  const out = {};
  const stack = [{ obj: input, prefix: '' }];

  while (stack.length > 0) {
    const frame = stack.pop();
    const obj = frame.obj;
    const prefix = frame.prefix;

    for (const key of Object.keys(obj)) {
      const path = prefix === '' ? key : prefix + separator + key;
      const value = obj[key];

      if (isPlainObject(value)) {
        stack.push({ obj: value, prefix: path });
      } else {
        out[path] = value;
      }
    }
  }

  return out;
}

/**
 * Reconstruct a nested plain object from a flat one whose keys use the given
 * separator.
 *
 * If two keys describe overlapping paths where one is a prefix of the other,
 * the last key in iteration order wins, replacing the earlier branch. This is
 * the simplest rule that keeps the function total and predictable; callers who
 * need conflict detection should validate their input before calling.
 *
 * @param {Record<string, unknown>} input
 * @param {{ separator?: string }} [options]
 * @param {string} [options.separator='.'] - String that separates path segments.
 * @returns {Record<string, unknown>}
 */
export function unflatten(input, options = {}) {
  const separator = typeof options === 'string' ? options : options.separator ?? '.';
  if (typeof separator !== 'string') {
    throw new TypeError('separator must be a string');
  }
  if (separator === '') {
    throw new TypeError('separator must not be empty');
  }
  if (!isPlainObject(input)) {
    throw new TypeError('unflatten expects a plain object');
  }

  const result = {};

  for (const key of Object.keys(input)) {
    const parts = key.split(separator);
    let cursor = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts[i];
      let next = cursor[segment];
      if (!isPlainObject(next)) {
        next = {};
        cursor[segment] = next;
      }
      cursor = next;
    }

    cursor[parts[parts.length - 1]] = input[key];
  }

  return result;
}
