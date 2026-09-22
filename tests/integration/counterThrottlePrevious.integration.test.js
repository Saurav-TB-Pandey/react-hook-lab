const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { wait } = require('../setup');
const { useCounter, useThrottle, usePrevious } = hooks;

test('Integration: useCounter + useThrottle + usePrevious creates a bounded rate-limited counter', async () => {
  let latestState;

  function BoundedThrottledCart({ min = 1, max = 10 }) {
    const counter = useCounter(1, { min, max });
    const throttledCount = useThrottle(counter.count, 80);
    const previousThrottled = usePrevious(throttledCount);

    latestState = {
      count: counter.count,
      increment: counter.increment,
      decrement: counter.decrement,
      set: counter.set,
      reset: counter.reset,
      throttledCount,
      previousThrottled,
    };

    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(BoundedThrottledCart));
  });

  assert.equal(latestState.count, 1);
  assert.equal(latestState.throttledCount, 1);

  // Rapidly increment 5 times
  act(() => {
    latestState.increment();
    latestState.increment();
    latestState.increment();
  });

  // Direct count is immediately 4
  assert.equal(latestState.count, 4);
  // Throttled count has not updated yet within the throttle window
  assert.equal(latestState.throttledCount, 1);

  // Wait for throttle window to expire
  await act(async () => {
    await wait(120);
  });

  // Now throttled count updates to 4, and previous was 1
  assert.equal(latestState.throttledCount, 4);
  assert.equal(latestState.previousThrottled, 1);

  // Exceed max bound (max is 10)
  act(() => {
    latestState.set(99);
  });

  assert.equal(latestState.count, 10, 'useCounter safely clamps to max bound 10');

  act(() => {
    renderer.unmount();
  });
});
