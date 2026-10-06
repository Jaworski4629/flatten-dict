import { test } from 'node:test';
import assert from 'node:assert/strict';

import { flatten, unflatten } from '../src/index.js';

test('flatten joins nested keys with the default separator', () => {
  const out = flatten({ a: { b: { c: 1 } } });
  assert.deepEqual(out, { 'a.b.c': 1 });
});

test('flatten accepts a custom separator', () => {
  const out = flatten({ a: { b: 2 } }, { separator: '/' });
  assert.deepEqual(out, { 'a/b': 2 });
});

test('flatten accepts a bare string separator for brevity', () => {
  const out = flatten({ a: { b: 2 } }, '/');
  assert.deepEqual(out, { 'a/b': 2 });
});

test('flatten treats arrays as opaque leaves', () => {
  const out = flatten({ a: { b: [1, 2, 3] } });
  assert.deepEqual(out, { 'a.b': [1, 2, 3] });
});

test('flatten preserves null and undefined as leaves', () => {
  const out = flatten({ a: null, b: undefined, c: { d: null } });
  assert.deepEqual(out, { a: null, b: undefined, 'c.d': null });
});

test('flatten handles empty objects', () => {
  assert.deepEqual(flatten({}), {});
});

test('flatten handles an empty nested object by emitting no key', () => {
  // An empty object has no leaves, so it contributes nothing to the output.
  // This is the deliberate choice: flattening is about leaves, not structure.
  const out = flatten({ a: {}, b: 1 });
  assert.deepEqual(out, { b: 1 });
});

test('flatten supports null-prototype objects', () => {
  const dict = Object.create(null);
  dict.a = Object.create(null);
  dict.a.b = 5;
  assert.deepEqual(flatten(dict), { 'a.b': 5 });
});

test('flatten throws on non-object input', () => {
  assert.throws(() => flatten(null), TypeError);
  assert.throws(() => flatten('x'), TypeError);
  assert.throws(() => flatten([1, 2]), TypeError);
});

test('unflatten reconstructs a nested object from flat keys', () => {
  const out = unflatten({ 'a.b.c': 1 });
  assert.deepEqual(out, { a: { b: { c: 1 } } });
});

test('unflatten honours a custom separator', () => {
  const out = unflatten({ 'a/b': 2 }, { separator: '/' });
  assert.deepEqual(out, { a: { b: 2 } });
});

test('flatten and unflatten round-trip for simple nested data', () => {
  const original = { user: { name: 'Ada', age: 36 }, active: true };
  assert.deepEqual(unflatten(flatten(original)), original);
});

test('unflatten lets the last key win on conflicting prefixes', () => {
  // { 'a': 1, 'a.b': 2 } cannot both hold: either `a` is a leaf or a subtree.
  // We choose last-wins so behaviour is defined and testable.
  const out = unflatten({ a: 1, 'a.b': 2 });
  assert.deepEqual(out, { a: { b: 2 } });
});

test('unflatten rejects an empty separator', () => {
  assert.throws(() => unflatten({ a: 1 }, { separator: '' }), TypeError);
});

test('unflatten throws on non-object input', () => {
  assert.throws(() => unflatten(null), TypeError);
  assert.throws(() => unflatten(42), TypeError);
});
