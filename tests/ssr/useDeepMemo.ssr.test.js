const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useDeepMemo computes memoized value on server', () => {
  let memoized;

  function App() {
    const deps = { key: 'val' };
    memoized = hooks.useDeepMemo(() => ({ result: deps.key.toUpperCase() }), [deps]);
    return React.createElement('div', null, memoized.result);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /VAL/);
  assert.deepEqual(memoized, { result: 'VAL' });
});
