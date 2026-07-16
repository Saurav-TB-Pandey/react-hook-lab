const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useBoolean } = hooks;

test('useBoolean exposes setters and toggle helpers', () => {
  let latestState;

  function TestComponent() {
    latestState = useBoolean(false);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.value, false);

  act(() => {
    latestState.setTrue();
  });
  assert.equal(latestState.value, true);

  act(() => {
    latestState.toggle();
  });
  assert.equal(latestState.value, false);

  act(() => {
    latestState.setFalse();
  });
  assert.equal(latestState.value, false);
});
