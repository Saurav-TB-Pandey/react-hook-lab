const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { wait } = require('./setup');
const { useAsync } = hooks;

test('useAsync executes immediately and stores resolved data', async () => {
  let latestState;
  let resolveAsync;
  const asyncFunction = () =>
    new Promise((resolve) => {
      resolveAsync = resolve;
    });

  function TestComponent() {
    latestState = useAsync(asyncFunction, []);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.loading, true);
  assert.equal(latestState.data, undefined);

  await act(async () => {
    resolveAsync('loaded');
    await wait(0);
  });

  assert.equal(latestState.loading, false);
  assert.equal(latestState.data, 'loaded');
  assert.equal(latestState.error, null);
});
