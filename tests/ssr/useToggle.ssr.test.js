const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useToggle renders default value', () => {
  let toggleVal;

  function App() {
    const toggle = hooks.useToggle('open', 'closed');
    toggleVal = toggle.value;
    return React.createElement('div', null, toggle.value);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /open/);
  assert.equal(toggleVal, 'open');
});
