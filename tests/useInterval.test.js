const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { wait } = require('./setup');
const { useInterval } = hooks;

test('useInterval starts automatically and stops cleanly', async () => {
  let latestState;
  let callCount = 0;
  let renderer;

  function TestComponent() {
    latestState = useInterval(() => {
      callCount += 1;
    }, 10);
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.isRunning(), true);

  await act(async () => {
    await wait(80);
  });

  try {
    assert.ok(callCount >= 2);
  } finally {
    act(() => {
      latestState.stop();
    });
  }

  const countAfterStop = callCount;

  await act(async () => {
    await wait(40);
  });

  try {
    assert.equal(callCount, countAfterStop);
    assert.equal(latestState.isRunning(), false);
  } finally {
    act(() => {
      renderer.unmount();
    });
  }
});
