const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useSharedState } = hooks;

test('useSharedState initializes, reads, and updates state', () => {
  let latestState;
  
  function TestComponent() {
    latestState = hooks.useSharedState('test-key', 'initial');
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'initial');

  act(() => {
    latestState[1]('updated');
  });

  assert.equal(latestState[0], 'updated');
});
