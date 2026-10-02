const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.ResizeObserver;
}

test('SSR: useResizeObserver renders zero size and undefined entry', () => {
  ensureCleanSSR();
  let result;

  function App() {
    const ref = { current: null };
    result = hooks.useResizeObserver(ref);
    return React.createElement('div', null, `${result.width}x${result.height}`);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /0x0/);
  assert.deepEqual(result.size, { width: 0, height: 0 });
  assert.equal(result.width, 0);
  assert.equal(result.height, 0);
  assert.equal(result.entry, undefined);
});
