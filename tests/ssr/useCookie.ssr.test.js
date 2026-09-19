const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useCookie renders initialValue when document.cookie is missing', () => {
  ensureCleanSSR();
  let cookieVal;

  function App() {
    const [val] = hooks.useCookie('auth_token', { initialValue: 'ssr-token-xyz' });
    cookieVal = val;
    return React.createElement('div', null, val);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /ssr-token-xyz/);
  assert.equal(cookieVal, 'ssr-token-xyz');
});
