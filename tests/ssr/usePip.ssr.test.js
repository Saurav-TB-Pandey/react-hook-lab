const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: usePip renders isSupported: false and isOpen: false without documentPictureInPicture', () => {
  ensureCleanSSR();
  let pipState;

  function App() {
    pipState = hooks.usePip();
    return React.createElement('div', null, pipState.isSupported ? 'pip-supported' : 'pip-unsupported');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /pip-unsupported/);
  assert.equal(pipState.isSupported, false);
  assert.equal(pipState.isOpen, false);
});
