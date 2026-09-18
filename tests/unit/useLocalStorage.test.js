const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal, createStorage } = require('../setup');
const { useLocalStorage } = hooks;

test('useLocalStorage reads and writes JSON values', () => {
  const storage = createStorage({
    theme: JSON.stringify('dark'),
  });
  let latestState;

  setGlobal('window', {});
  setGlobal('localStorage', storage);

  function TestComponent() {
    latestState = useLocalStorage('theme', 'light');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'dark');

  act(() => {
    latestState[1]('light');
  });

  assert.equal(latestState[0], 'light');
  assert.equal(storage.store.theme, JSON.stringify('light'));
});

test('useLocalStorage supports functional updates', () => {
  const storage = createStorage({
    count: JSON.stringify(10),
  });
  let latestState;

  setGlobal('window', {});
  setGlobal('localStorage', storage);

  function TestComponent() {
    latestState = useLocalStorage('count', 0);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 10);

  act(() => {
    latestState[1]((prev) => prev + 5);
  });

  assert.equal(latestState[0], 15);
  assert.equal(storage.store.count, JSON.stringify(15));
});

test('useLocalStorage synchronizes with cross-tab storage events', () => {
  const storage = createStorage({
    theme: JSON.stringify('light'),
  });
  let latestState;
  const listeners = {};

  setGlobal('window', {
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
    removeEventListener: (event) => {
      delete listeners[event];
    },
  });
  setGlobal('localStorage', storage);

  function TestComponent() {
    latestState = useLocalStorage('theme', 'light');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'light');

  // Simulate storage event from another tab
  act(() => {
    listeners.storage({
      key: 'theme',
      newValue: JSON.stringify('dark'),
    });
  });

  assert.equal(latestState[0], 'dark');

  // Simulate clearing/removing key in another tab
  act(() => {
    listeners.storage({
      key: 'theme',
      newValue: null,
    });
  });

  assert.equal(latestState[0], 'light');
});
