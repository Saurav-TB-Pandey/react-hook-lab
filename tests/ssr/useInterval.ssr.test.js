const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useInterval does not execute callback during server render', () => {
  let intervalRan = false;

  function App() {
    hooks.useInterval(() => {
      intervalRan = true;
    }, 10);
    return React.createElement('div', null, 'interval-rendered');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /interval-rendered/);
  assert.equal(intervalRan, false);
});
