const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { useDeepClone, deepClone } = require('..');

test('deepClone deep clones plain objects completely', () => {
  const original = { a: 1, b: { c: 2 } };
  const cloned = deepClone(original);
  
  assert.notEqual(original, cloned);
  assert.notEqual(original.b, cloned.b);
  assert.deepEqual(original, cloned);
});

test('deepClone skips cloning frozen objects for performance', () => {
  const original = Object.freeze({ a: 1, b: 2 });
  const cloned = deepClone(original);
  
  assert.equal(original, cloned); // Should return the exact same reference
});

test('deepClone avoids prototype pollution', () => {
  const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
  const cloned = deepClone(malicious);
  
  // The clone should have the same prototype as the malicious object (which is Object.prototype from JSON.parse)
  assert.equal({}.polluted, undefined); // Prototype should NOT be polluted
  assert.equal(cloned.__proto__.polluted, undefined);
});

test('deepClone handles circular references', () => {
  const original = { a: 1 };
  original.self = original; // circular
  
  const cloned = deepClone(original);
  assert.notEqual(original, cloned);
  assert.equal(cloned.self, cloned);
});

test('deepClone handles non-plain types', () => {
  const date = new Date();
  const map = new Map([['k', { v: 1 }]]);
  const set = new Set([{ v: 2 }]);
  const typedArray = new Uint8Array([1, 2, 3]);

  const clonedDate = deepClone(date);
  const clonedMap = deepClone(map);
  const clonedSet = deepClone(set);
  const clonedTyped = deepClone(typedArray);

  assert.notEqual(date, clonedDate);
  assert.equal(date.getTime(), clonedDate.getTime());

  assert.notEqual(map, clonedMap);
  assert.notEqual(map.get('k'), clonedMap.get('k'));
  assert.equal(clonedMap.get('k').v, 1);

  assert.notEqual(set, clonedSet);
  assert.notEqual([...set][0], [...clonedSet][0]);
  assert.equal([...clonedSet][0].v, 2);

  assert.notEqual(typedArray, clonedTyped);
  assert.equal(clonedTyped[0], 1);
});

test('useDeepClone returns stable reference if input reference is unchanged', () => {
  let latestClone;
  const originalObj = { a: 1 };
  
  function TestComponent({ val }) {
    latestClone = useDeepClone(val);
    return null;
  }

  const renderer = TestRenderer.create(React.createElement(TestComponent, { val: originalObj }));
  
  const clone1 = latestClone;
  assert.notEqual(originalObj, clone1); // deeply cloned

  // Re-render with SAME reference
  act(() => {
    renderer.update(React.createElement(TestComponent, { val: originalObj }));
  });

  const clone2 = latestClone;
  assert.equal(clone1, clone2); // stable!
  
  // Re-render with NEW reference
  const newObj = { a: 1 }; // structurally identical but new ref
  act(() => {
    renderer.update(React.createElement(TestComponent, { val: newObj }));
  });

  const clone3 = latestClone;
  assert.notEqual(clone1, clone3); // new clone generated
});
