const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.Notification;
}

test('SSR: useNotifications renders isSupported: false without Notification API', () => {
  ensureCleanSSR();
  let notifState;

  function App() {
    notifState = hooks.useNotifications({ autoRequest: false });
    return React.createElement('div', null, String(notifState.isSupported));
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /false/);
  assert.equal(notifState.isSupported, false);
});
