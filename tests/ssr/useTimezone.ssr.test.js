const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
}

test('SSR: useTimezone returns null on server for hydration consistency', () => {
  ensureCleanSSR();
  let tzValue;

  function App() {
    tzValue = hooks.useTimezone();
    return React.createElement('div', null, `tz:${tzValue}`);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /tz:/);
  assert.equal(tzValue, null);
});
