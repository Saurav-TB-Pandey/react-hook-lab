const test = require('node:test');
const assert = require('node:assert');
const { deepEqual } = require('../dist/utils');

test('deepEqual handles primitives', () => {
  assert.strictEqual(deepEqual(1, 1), true);
  assert.strictEqual(deepEqual(1, 2), false);
  assert.strictEqual(deepEqual('a', 'a'), true);
  assert.strictEqual(deepEqual(null, null), true);
  assert.strictEqual(deepEqual(undefined, undefined), true);
  assert.strictEqual(deepEqual(null, undefined), false);
});

test('deepEqual handles arrays', () => {
  assert.strictEqual(deepEqual([1, 2, 3], [1, 2, 3]), true);
  assert.strictEqual(deepEqual([1, 2, 3], [1, 2, 4]), false);
  assert.strictEqual(deepEqual([1, 2, 3], [1, 2]), false);
});

test('deepEqual handles plain objects', () => {
  assert.strictEqual(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
  assert.strictEqual(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }), false);
  assert.strictEqual(deepEqual({ a: 1, b: 2 }, { a: 1 }), false);
  assert.strictEqual(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }), true);
});

test('deepEqual handles Date, RegExp, Map, Set', () => {
  assert.strictEqual(deepEqual(new Date('2024-01-01'), new Date('2024-01-01')), true);
  assert.strictEqual(deepEqual(new RegExp('ab+c', 'i'), new RegExp('ab+c', 'i')), true);
  
  const m1 = new Map([['a', 1], ['b', 2]]);
  const m2 = new Map([['a', 1], ['b', 2]]);
  assert.strictEqual(deepEqual(m1, m2), true);

  const s1 = new Set([1, 2, 3]);
  const s2 = new Set([1, 2, 3]);
  assert.strictEqual(deepEqual(s1, s2), true);
});

test('deepEqual handles circular references safely', () => {
  const a = { b: 1 };
  a.circular = a;
  const b = { b: 1 };
  b.circular = b;
  
  assert.strictEqual(deepEqual(a, b), true);
});
