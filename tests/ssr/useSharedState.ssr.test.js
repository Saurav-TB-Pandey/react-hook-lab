const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.BroadcastChannel;
}

test('SSR: useSharedState renders initial value without BroadcastChannel', () => {
  ensureCleanSSR();
  let stateVal;

  function App() {
    const [state] = hooks.useSharedState('channel:theme', 'dark-theme');
    stateVal = state;
    return React.createElement('div', null, state);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /dark-theme/);
  assert.equal(stateVal, 'dark-theme');
});
