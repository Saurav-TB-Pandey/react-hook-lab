const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useResource marks server render mode without executing client fetches', () => {
  ensureCleanSSR();
  let resourceResult;
  let fetchExecuted = false;

  function App() {
    resourceResult = hooks.useResource('ssr-users', async () => {
      fetchExecuted = true;
      return [{ id: 1, name: 'Alice' }];
    });
    return React.createElement('div', null, resourceResult.isLoading ? 'loading' : 'ready');
  }

  const html = renderToString(React.createElement(App));
  assert.ok(html.length > 0);
  assert.equal(fetchExecuted, false);
});
