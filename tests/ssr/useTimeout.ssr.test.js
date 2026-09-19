const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useTimeout does not execute callback during server render', () => {
  let timeoutRan = false;

  function App() {
    hooks.useTimeout(() => {
      timeoutRan = true;
    }, 10);
    return React.createElement('div', null, 'timeout-rendered');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /timeout-rendered/);
  assert.equal(timeoutRan, false);
});
