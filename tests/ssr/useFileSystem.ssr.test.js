const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useFileSystem renders isSupported: false and status: idle', () => {
  ensureCleanSSR();
  let fsState;

  function App() {
    fsState = hooks.useFileSystem();
    return React.createElement('div', null, fsState.status);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(fsState.isSupported, false);
  assert.equal(fsState.status, 'idle');
  assert.equal(fsState.file, null);
});
