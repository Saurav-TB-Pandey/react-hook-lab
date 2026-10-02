const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useDownload returns idle status without DOM link creation', () => {
  ensureCleanSSR();
  let downloadState;

  function App() {
    downloadState = hooks.useDownload();
    return React.createElement('div', null, downloadState.status);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(downloadState.status, 'idle');
  assert.equal(downloadState.error, null);
});
