const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.IntersectionObserver;
}

test('SSR: useIntersectionObserver renders non-intersecting default state', () => {
  ensureCleanSSR();
  let result;

  function App() {
    const ref = { current: null };
    result = hooks.useIntersectionObserver(ref);
    return React.createElement('div', null, result.isIntersecting ? 'visible' : 'hidden');
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /hidden/);
  assert.equal(result.isIntersecting, false);
  assert.equal(result.entry, undefined);
});
