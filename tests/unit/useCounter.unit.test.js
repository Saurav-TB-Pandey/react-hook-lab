const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
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

test('useCounter clamps initialValue and resets within bounds', () => {
  let latestState;

  function TestComponent() {
    latestState = useCounter(100, { min: 0, max: 10 });
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  // initialValue 100 should be clamped to max 10
  assert.equal(latestState.count, 10);

  act(() => {
    latestState.set(5);
  });
  assert.equal(latestState.count, 5);

  act(() => {
    latestState.reset();
  });
  // reset should clamp back to 10
  assert.equal(latestState.count, 10);
});
