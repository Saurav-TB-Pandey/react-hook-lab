const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useTabVisibility renders default active state without document/window', () => {
  ensureCleanSSR();
  let tabState;

  function App() {
    tabState = hooks.useTabVisibility({
      onActivate: () => { throw new Error('should not fire on server'); },
      onDeactivate: () => { throw new Error('should not fire on server'); },
    });
    return React.createElement('div', null, tabState.isActive ? 'active' : 'inactive');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /active/);
  assert.equal(tabState.isActive, true);
  assert.equal(tabState.isVisible, true);
  assert.equal(tabState.isFocused, true);
  assert.equal(tabState.lastActiveAt, null);
  assert.equal(tabState.lastInactiveAt, null);
});
