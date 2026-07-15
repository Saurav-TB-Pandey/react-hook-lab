const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { wait } = require('./setup');
const { useThrottle } = hooks;

test('useThrottle emits the latest value after the throttle window', async () => {
  let latestValue = '';
  let renderer;

  function TestComponent({ value }) {
    latestValue = useThrottle(value, 20);
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(TestComponent, { value: 'first' })
    );
  });

  assert.equal(latestValue, 'first');

  act(() => {
    renderer.update(
      React.createElement(TestComponent, { value: 'second' })
    );
  });

  assert.equal(latestValue, 'first');

  await act(async () => {
    await wait(30);
  });

  assert.equal(latestValue, 'second');
});
