const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.sessionStorage;
}

test('SSR: useSessionStorage renders initial fallback value safely', () => {
  ensureCleanSSR();
  let storedVal;

  function App() {
    const [val] = hooks.useSessionStorage('ssr-token', 'session-123');
    storedVal = val;
    return React.createElement('div', null, val);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /session-123/);
  assert.equal(storedVal, 'session-123');
});
