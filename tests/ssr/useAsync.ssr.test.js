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

test('SSR: useAsync renders initial loading state without executing effects', () => {
  ensureCleanSSR();
  let asyncState;
  let executed = false;

  function App() {
    asyncState = hooks.useAsync(async () => {
      executed = true;
      return 'data';
    }, []);
    return React.createElement('div', null, asyncState.loading ? 'loading' : 'ready');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /loading/);
  assert.equal(asyncState.loading, true);
  assert.equal(asyncState.data, undefined);
  assert.equal(asyncState.error, null);
  assert.equal(executed, false);
});
