const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
  delete global.indexedDB;
}

test('SSR: useIndexedDB & createIndexedDB render fallback status without indexedDB', () => {
  ensureCleanSSR();
  hooks.createIndexedDB({
    dbName: 'ssr-test-db',
    version: 1,
    stores: ['settings'],
  });

  let capturedValue;
  let capturedMeta;

  function App() {
    const [val, , meta] = hooks.useIndexedDB('settings', 'theme', { dark: true });
    capturedValue = val;
    capturedMeta = meta;
    return React.createElement('div', null, `${val.dark}:${meta.status}`);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /true:idle/);
  assert.deepEqual(capturedValue, { dark: true });
  assert.equal(capturedMeta.status, 'idle');
  assert.equal(capturedMeta.error, null);
});
