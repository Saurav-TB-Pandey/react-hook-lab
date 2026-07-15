const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal, createStorage } = require('./setup');
const { useSessionStorage } = hooks;

test('useSessionStorage reads and writes JSON values', () => {
  const storage = createStorage({
    draft: JSON.stringify('saved'),
  });
  let latestState;

  setGlobal('window', {});
  setGlobal('sessionStorage', storage);

  function TestComponent() {
    latestState = useSessionStorage('draft', '');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'saved');

  act(() => {
    latestState[1]('updated');
  });

  assert.equal(latestState[0], 'updated');
  assert.equal(storage.store.draft, JSON.stringify('updated'));
});
