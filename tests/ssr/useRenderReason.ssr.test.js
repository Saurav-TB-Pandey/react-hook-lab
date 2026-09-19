const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useRenderReason runs safely on server without errors', () => {
  ensureCleanSSR();

  function App({ count }) {
    hooks.useRenderReason('App', { count });
    return React.createElement('div', null, `count:${count}`);
  }

  const html = renderToString(React.createElement(App, { count: 1 }));
  assert.match(html, /count:1/);
});
