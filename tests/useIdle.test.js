const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useIdle } = hooks;

test('useIdle initializes to false', () => {
  let latestState;
  
  function TestComponent() {
    latestState = useIdle();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState, false);
});
