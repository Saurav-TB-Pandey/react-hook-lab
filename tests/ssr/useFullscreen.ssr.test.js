const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useFullscreen renders isFullscreen: false without document', () => {
  ensureCleanSSR();
  let fsState;

  function App() {
    fsState = hooks.useFullscreen();
    return React.createElement('div', null, fsState.isFullscreen ? 'fullscreen' : 'windowed');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /windowed/);
  assert.equal(fsState.isFullscreen, false);
  assert.equal(fsState.error, null);
});
