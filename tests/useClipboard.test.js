const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal, wait } = require('./setup');
const { useClipboard } = hooks;

test('useClipboard copies text and resets copied state', async () => {
  let latestState;
  let copiedText = '';

  setGlobal('navigator', {
    clipboard: {
      writeText: async (value) => {
        copiedText = value;
      },
    },
  });

  function TestComponent() {
    latestState = useClipboard(100);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  let success;
  await act(async () => {
    success = await latestState.copy('hello');
  });

  assert.equal(success, true);
  assert.equal(copiedText, 'hello');
  assert.equal(latestState.copied, true);
  assert.equal(latestState.error, null);

  await act(async () => {
    await wait(150);
  });

  assert.equal(latestState.copied, false);
});
