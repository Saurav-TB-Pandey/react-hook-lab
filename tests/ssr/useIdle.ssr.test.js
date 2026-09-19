const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useIdle renders false without window activity listeners', () => {
  ensureCleanSSR();
  let isIdle;

  function App() {
    isIdle = hooks.useIdle(5000);
    return React.createElement('div', null, isIdle ? 'idle' : 'active');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /active/);
  assert.equal(isIdle, false);
});
