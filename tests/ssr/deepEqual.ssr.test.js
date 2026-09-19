const { test } = require('node:test');
const assert = require('node:assert/strict');
const hooks = require('../..');

test('SSR: deepEqual executes pure deep equality comparisons on server', () => {
  assert.equal(hooks.deepEqual({ a: 1, b: [2] }, { a: 1, b: [2] }), true);
  assert.equal(hooks.deepEqual({ a: 1 }, { a: 2 }), false);
});
