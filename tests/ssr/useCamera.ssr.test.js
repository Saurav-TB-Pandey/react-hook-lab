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

test('SSR: useCamera renders idle status without navigator.mediaDevices crash', () => {
  ensureCleanSSR();
  let cameraState;

  function App() {
    cameraState = hooks.useCamera();
    return React.createElement('div', null, cameraState.status);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /idle/);
  assert.equal(cameraState.status, 'idle');
  assert.equal(cameraState.isRecording, false);
  assert.equal(cameraState.stream, null);
  assert.equal(cameraState.error, null);
});
