const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.localStorage;
}

test('SSR: useLocalStorage renders initial fallback value safely', () => {
  ensureCleanSSR();
  let storedVal;

  function App() {
    const [val] = hooks.useLocalStorage('ssr-theme', 'dark-mode');
    storedVal = val;
    return React.createElement('div', null, val);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /dark-mode/);
  assert.equal(storedVal, 'dark-mode');
});
