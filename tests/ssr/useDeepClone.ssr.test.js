const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useDeepClone clones complex object on server', () => {
  let clonedObj;

  function App() {
    const orig = { items: [1, 2, { name: 'clone-me' }] };
    clonedObj = hooks.useDeepClone(orig);
    return React.createElement('div', null, clonedObj.items[2].name);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /clone-me/);
  assert.deepEqual(clonedObj, { items: [1, 2, { name: 'clone-me' }] });
});
