const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { wait } = require('./setup');
const { useTimeout } = hooks;

test('useTimeout starts automatically and can be restarted', async () => {
  let latestState;
  let callCount = 0;

  function TestComponent() {
    latestState = useTimeout(() => {
      callCount += 1;
    }, 10);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.isActive(), true);

  await act(async () => {
    await wait(20);
  });

  assert.equal(callCount, 1);
  assert.equal(latestState.isActive(), false);

  act(() => {
    latestState.restart();
  });
  assert.equal(latestState.isActive(), true);

  act(() => {
    latestState.clear();
  });
  assert.equal(latestState.isActive(), false);
});
