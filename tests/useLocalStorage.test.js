const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal, createStorage } = require('./setup');
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
