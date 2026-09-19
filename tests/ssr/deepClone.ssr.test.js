const { test } = require('node:test');
const assert = require('node:assert/strict');
const hooks = require('../..');

test('SSR: deepClone executes pure deep clone operations on server', () => {
  const original = { a: 1, b: { c: [10, 20] } };
  const cloned = hooks.deepClone(original);

  assert.notEqual(cloned, original);
  assert.deepEqual(cloned, original);
});
