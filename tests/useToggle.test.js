const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useToggle } = hooks;

test('useToggle switches between default and reverse values', () => {
  let latestState;

  function TestComponent() {
    latestState = useToggle('grid', 'list');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.value, 'grid');

  act(() => {
    latestState.toggle();
  });
  assert.equal(latestState.value, 'list');

  act(() => {
    latestState.toggle();
  });
  assert.equal(latestState.value, 'grid');
});
