const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal, wait } = require('./setup');
const { useWidth } = hooks;

test('useWidth reports initial width and updates on resize', async () => {
  const listeners = {};
  let latestWidth = 0;

  setGlobal('window', {
    innerWidth: 1024,
    addEventListener: (eventName, listener) => {
      listeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete listeners[eventName];
    },
    clearTimeout,
    setTimeout,
  });

  function TestComponent() {
    latestWidth = useWidth();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestWidth, 1024);

  global.window.innerWidth = 768;
  act(() => {
    listeners.resize();
  });

  await act(async () => {
    await wait(170);
  });

  assert.equal(latestWidth, 768);
});
