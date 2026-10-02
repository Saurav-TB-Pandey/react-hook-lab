const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
  delete global.navigator;
}

test('SSR: useDebounce returns initial value synchronously', () => {
  ensureCleanSSR();
  let debouncedVal;

  function App() {
    debouncedVal = hooks.useDebounce('search-term', 300);
    return React.createElement('div', null, debouncedVal);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /search-term/);
  assert.equal(debouncedVal, 'search-term');
});
