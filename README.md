# flatten-dict

Flatten nested plain objects into dot-separated keys and build them back. Zero
runtime dependencies, ESM only.

```js
import { flatten, unflatten } from 'flatten-dict';

const flat = flatten({ user: { name: 'Ada' }, active: true });
// { 'user.name': 'Ada', active: true }

const nested = unflatten({ 'user.name': 'Ada', active: true });
// { user: { name: 'Ada' }, active: true }
```

Both functions accept an options object: `{ separator: '.' }` by default. You
can also pass a bare string, e.g. `flatten(dict, '/')`.

## Why this exists

Flattening is useful when you need to pass nested config into something that
takes flat key/value pairs — environment variables, form fields, CLI flags —
and then reconstruct it later. The trade-off here is simplicity over escaping:
no attempt is made to handle separators that appear inside keys. If your keys
contain `.`, pick a separator they do not contain.

## The awkward edge

**No escaping is performed.** If a leaf key contains the separator,
`unflatten(flatten(x))` will not return `x`. For example:

```js
flatten({ 'a.b': 1 })        // { 'a.b': 1 }
unflatten({ 'a.b': 1 })       // { a: { b: 1 } }  — different shape
```

This is deliberate. Every escaping scheme either bloats keys or breaks
round-tripping for some other input. Pick a separator that does not appear in
your keys.

Arrays are treated as opaque leaves, not expanded into indexed keys. `null`
and `undefined` are preserved as leaves rather than dropped.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

