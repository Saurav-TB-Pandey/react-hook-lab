const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useBoolean renders initial boolean state', () => {
  let boolVal;

  function App() {
    const bool = hooks.useBoolean(true);
    boolVal = bool.value;
    return React.createElement('div', null, bool.value ? 'true' : 'false');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /true/);
  assert.equal(boolVal, true);
});
