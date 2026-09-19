const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.navigator;
}

test('SSR: useOnlineStatus renders safely without navigator.onLine', () => {
  ensureCleanSSR();
  let onlineState;

  function App() {
    onlineState = hooks.useOnlineStatus();
    return React.createElement('div', null, String(onlineState));
  }

  const html = renderToString(React.createElement(App));
  assert.ok(html.length > 0);
  assert.ok(onlineState === undefined || typeof onlineState === 'boolean');
});
