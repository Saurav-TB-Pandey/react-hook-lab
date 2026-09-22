const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { wait } = require('../setup');
const { useAsync, useTimeout, useCounter } = hooks;

test('Integration: useAsync + useTimeout + useCounter coordinates async execution with request deadline and retry tracking', async () => {
  let resolvePromise;
  let coordinatorState;

  function AsyncDataLoader() {
    const { count: attempt, increment: retry } = useCounter(1, { min: 1, max: 5 });
    const [timedOut, setTimedOut] = React.useState(false);

    // Timeout watchdog: alerts if query does not resolve in 50ms
    const timeoutWatchdog = useTimeout(() => {
      setTimedOut(true);
    }, 50);

    const asyncResult = useAsync(async () => {
      setTimedOut(false);
      timeoutWatchdog.restart();
      return new Promise((resolve) => {
        resolvePromise = resolve;
      });
    }, [attempt]);

    coordinatorState = {
      attempt,
      retry,
      timedOut,
      asyncResult,
      timeoutWatchdog,
    };

    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(AsyncDataLoader));
  });

  assert.equal(coordinatorState.attempt, 1);
  assert.equal(coordinatorState.asyncResult.loading, true);
  assert.equal(coordinatorState.timedOut, false);

  // Exceed the 50ms watchdog timeout without resolving
  await act(async () => {
    await wait(70);
  });

  assert.equal(coordinatorState.timedOut, true);
  assert.equal(coordinatorState.asyncResult.loading, true);

  // User retries query
  act(() => {
    coordinatorState.retry();
  });

  assert.equal(coordinatorState.attempt, 2);
  assert.equal(coordinatorState.timedOut, false);
  assert.equal(coordinatorState.asyncResult.loading, true);

  // This time, the async query resolves in 10ms (well within deadline)
  await act(async () => {
    resolvePromise({ success: true, payload: ['item1', 'item2'] });
    coordinatorState.timeoutWatchdog.clear();
    await wait(20);
  });

  assert.equal(coordinatorState.asyncResult.loading, false);
  assert.deepEqual(coordinatorState.asyncResult.data, { success: true, payload: ['item1', 'item2'] });
  assert.equal(coordinatorState.timedOut, false);
});
