const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useMicrophone } = hooks;

test('useMicrophone initializes correctly', () => {
  let latestState;
  
  function TestComponent() {
    latestState = useMicrophone();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.status, 'idle');
  assert.equal(latestState.audioLevel, 0);
  assert.equal(latestState.isRecording, false);
});
