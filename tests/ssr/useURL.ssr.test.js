const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
}

test('SSR: useURL renders safe empty URL object without window.location', () => {
  ensureCleanSSR();
  let urlState;

  function App() {
    urlState = hooks.useURL();
    return React.createElement('div', null, urlState.href || 'empty');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /empty/);
  assert.equal(urlState.href, '');
  assert.equal(urlState.isHome, true);
  assert.deepEqual(urlState.segments, []);
  assert.equal(urlState.breadcrumbs.length, 1);
  assert.equal(urlState.breadcrumbs[0].name, 'Home');
});
