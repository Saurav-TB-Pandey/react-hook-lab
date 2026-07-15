const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useOnlineStatus } = hooks;

test('useOnlineStatus tracks browser online and offline events', () => {
  const listeners = {};
  let latestStatus;

  setGlobal('navigator', { onLine: false });
  setGlobal('window', {
    addEventListener: (eventName, listener) => {
      listeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete listeners[eventName];
    },
  });

  function TestComponent() {
    latestStatus = useOnlineStatus();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestStatus, false);

  act(() => {
    listeners.online();
  });

  assert.equal(latestStatus, true);

  act(() => {
    listeners.offline();
  });

  assert.equal(latestStatus, false);
});
