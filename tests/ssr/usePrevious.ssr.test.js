const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: usePrevious returns undefined on initial server render', () => {
  let prevVal;

  function App() {
    prevVal = hooks.usePrevious('initial-value');
    return React.createElement('div', null, String(prevVal));
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /undefined/);
  assert.equal(prevVal, undefined);
});
