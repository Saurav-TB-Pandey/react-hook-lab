const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useClickOutside renders safely without attaching document listeners', () => {
  ensureCleanSSR();
  let callbackFired = false;

  function App() {
    const ref = { current: null };
    hooks.useClickOutside(ref, () => {
      callbackFired = true;
    });
    return React.createElement('div', null, 'dropdown');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /dropdown/);
  assert.equal(callbackFired, false);
});
