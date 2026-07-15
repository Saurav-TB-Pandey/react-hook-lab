const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { wait } = require('./setup');
const {
  useAsync,
  useAsyncDebounce
} = hooks;

test('useAsyncDebounce runs the callback after the delay', async () => {
  let latestState;
  const callback = async () => 'done';

  function TestComponent() {
    latestState = useAsyncDebounce(callback, 10);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.loading, false);

  await act(async () => {
    await wait(30);
  });

  assert.equal(latestState.result, 'done');
  assert.equal(latestState.loading, false);
  assert.equal(latestState.error, undefined);
});
