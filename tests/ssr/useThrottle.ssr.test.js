const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
  delete global.navigator;
}

test('SSR: useThrottle returns initial value synchronously', () => {
  ensureCleanSSR();
  let throttledVal;

  function App() {
    throttledVal = hooks.useThrottle('scroll-pos', 300);
    return React.createElement('div', null, throttledVal);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /scroll-pos/);
  assert.equal(throttledVal, 'scroll-pos');
});
