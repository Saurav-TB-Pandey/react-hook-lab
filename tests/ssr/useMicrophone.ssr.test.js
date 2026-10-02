const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.navigator;
}

test('SSR: useMicrophone renders idle status and 0 audio level without mediaDevices', () => {
  ensureCleanSSR();
  let micState;

  function App() {
    micState = hooks.useMicrophone();
    return React.createElement('div', null, micState.status);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(micState.status, 'idle');
  assert.equal(micState.isRecording, false);
  assert.equal(micState.audioLevel, 0);
  assert.equal(micState.error, null);
});
