const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deepClone } = require('../..');

test('deepClone deep clones plain objects completely', () => {
  const original = { a: 1, b: { c: 2 } };
  const cloned = deepClone(original);

  assert.notEqual(original, cloned);
  assert.notEqual(original.b, cloned.b);
  assert.deepEqual(original, cloned);
});

test('deepClone clones frozen objects into new mutable objects', () => {
  const original = Object.freeze({ a: 1, b: 2 });
  const cloned = deepClone(original);

  assert.notEqual(original, cloned);
  assert.deepEqual(original, cloned);
  assert.equal(Object.isFrozen(cloned), false);
  cloned.a = 42;
  assert.equal(cloned.a, 42);
  assert.equal(original.a, 1);
});

test('deepClone preserves own constructor property', () => {
  const original = { constructor: 'special', a: 1 };
  const cloned = deepClone(original);

  assert.notEqual(original, cloned);
  assert.equal(cloned.constructor, 'special');
  assert.equal(cloned.a, 1);
});

test('deepClone avoids prototype pollution', () => {
  const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
  const cloned = deepClone(malicious);

  assert.equal({}.polluted, undefined);
  assert.equal(cloned.polluted, undefined);
});

test('deepClone handles circular references', () => {
  const original = { a: 1 };
  original.self = original;

  const cloned = deepClone(original);
  assert.notEqual(original, cloned);
  assert.equal(cloned.self, cloned);
});

test('deepClone handles non-plain types', () => {
  const date = new Date(1700000000000);
  const regex = /abc/gi;
  const original = { date, regex, arr: [1, 2] };

  const cloned = deepClone(original);
  assert.notEqual(cloned.date, date);
  assert.equal(cloned.date.getTime(), date.getTime());
  assert.notEqual(cloned.regex, regex);
  assert.equal(cloned.regex.source, regex.source);
  assert.equal(cloned.regex.flags, regex.flags);
  assert.notEqual(cloned.arr, original.arr);
  assert.deepEqual(cloned.arr, original.arr);
});
