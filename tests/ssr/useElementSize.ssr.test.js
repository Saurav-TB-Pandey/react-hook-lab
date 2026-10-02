const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
  delete global.ResizeObserver;
}

test('SSR: useElementSize renders default zero dimensions without ResizeObserver', () => {
  ensureCleanSSR();
  let sizeValue;

  function App() {
    const ref = { current: null };
    sizeValue = hooks.useElementSize(ref);
    return React.createElement('div', null, `${sizeValue.width}x${sizeValue.height}`);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /0x0/);
  assert.deepEqual(sizeValue, { width: 0, height: 0 });
});
