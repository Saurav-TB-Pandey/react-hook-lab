const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useCounter renders initial count value', () => {
  let countVal;

  function App() {
    const counter = hooks.useCounter(100);
    countVal = counter.count;
    return React.createElement('div', null, String(counter.count));
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /100/);
  assert.equal(countVal, 100);
});
