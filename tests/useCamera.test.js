const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useCamera } = hooks;

test('useCamera initializes correctly', () => {
  let latestState;
  
  function TestComponent() {
    latestState = useCamera();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.status, 'idle');
  assert.equal(latestState.isRecording, false);
});
