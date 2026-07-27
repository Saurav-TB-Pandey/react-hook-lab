const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useDeepMemo } = hooks;

test('useDeepMemo computes value and respects deep dependency changes', () => {
  let computeCount = 0;
  let computedValue = 0;

  function TestComponent({ objDeps }) {
    computedValue = useDeepMemo(() => {
      computeCount++;
      return objDeps.a + objDeps.b;
    }, [objDeps]);

    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent, { objDeps: { a: 1, b: 2 } }));
  });
  
  assert.strictEqual(computeCount, 1);
  assert.strictEqual(computedValue, 3);

  // Update with structurally identical but reference-different object
  act(() => {
    renderer.update(React.createElement(TestComponent, { objDeps: { a: 1, b: 2 } }));
  });

  // Compute count should NOT increase
  assert.strictEqual(computeCount, 1);

  // Update with structurally different object
  act(() => {
    renderer.update(React.createElement(TestComponent, { objDeps: { a: 1, b: 3 } }));
  });

  // Compute count should increase
  assert.strictEqual(computeCount, 2);
  assert.strictEqual(computedValue, 4);
});
