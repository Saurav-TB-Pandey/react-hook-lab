const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useCounter } = hooks;

test('useCounter increments, decrements, clamps, sets, and resets', () => {
  let latestState;

  function TestComponent() {
    latestState = useCounter(2, {
      min: 0,
      max: 4,
      step: 2,
    });
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.count, 2);

  act(() => {
    latestState.increment();
  });
  assert.equal(latestState.count, 4);

  act(() => {
    latestState.increment();
  });
  assert.equal(latestState.count, 4);

  act(() => {
    latestState.decrement();
  });
  assert.equal(latestState.count, 2);

  act(() => {
    latestState.set(-10);
  });
  assert.equal(latestState.count, 0);

  act(() => {
    latestState.reset();
  });
  assert.equal(latestState.count, 2);
});
