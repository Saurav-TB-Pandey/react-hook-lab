const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.navigator;
}

test('SSR: useLocation renders idle status and null location without geolocation', () => {
  ensureCleanSSR();
  let locState;

  function App() {
    locState = hooks.useLocation();
    return React.createElement('div', null, locState.status);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(locState.status, 'idle');
  assert.equal(locState.location, null);
  assert.equal(locState.error, null);
});
