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

test('SSR: useClipboard renders default non-copied state without navigator.clipboard', () => {
  ensureCleanSSR();
  let clipState;

  function App() {
    clipState = hooks.useClipboard();
    return React.createElement('div', null, clipState.copied ? 'copied' : 'idle');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(clipState.copied, false);
  assert.equal(clipState.error, null);
  assert.equal(typeof clipState.copy, 'function');
  assert.equal(typeof clipState.reset, 'function');
});
