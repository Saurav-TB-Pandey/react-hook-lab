const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
  delete global.navigator;
}

test('SSR: useAsyncDebounce renders idle state safely without client timer', () => {
  ensureCleanSSR();
  let debouncedState;

  function App() {
    debouncedState = hooks.useAsyncDebounce(async (val) => val, 100);
    return React.createElement('div', null, debouncedState.loading ? 'loading' : 'idle');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(debouncedState.loading, false);
  assert.equal(debouncedState.result, undefined);
  assert.equal(debouncedState.error, undefined);
});
