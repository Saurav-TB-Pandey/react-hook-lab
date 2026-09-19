const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
}

test('SSR: useWidth renders safe fallback of 0 without window', () => {
  ensureCleanSSR();
  let widthVal;

  function App() {
    widthVal = hooks.useWidth();
    return React.createElement('div', null, `width:${widthVal}`);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /width:0/);
  assert.equal(widthVal, 0);
});
