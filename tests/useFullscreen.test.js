const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useFullscreen } = hooks;

test('useFullscreen enters and exits fullscreen', async () => {
  let latestState;
  let currentFullscreenElement = null;
  const listeners = {};

  const mockDocument = {
    addEventListener: (event, cb) => { listeners[event] = cb; },
    removeEventListener: (event, cb) => { if (listeners[event] === cb) delete listeners[event]; },
    get fullscreenElement() { return currentFullscreenElement; },
    exitFullscreen: async () => {
      if (!currentFullscreenElement) throw new Error("TypeError: Document not active");
      currentFullscreenElement = null;
      if (listeners['fullscreenchange']) listeners['fullscreenchange']();
    },
    documentElement: {
      requestFullscreen: async () => {
        currentFullscreenElement = mockDocument.documentElement;
        if (listeners['fullscreenchange']) listeners['fullscreenchange']();
      }
    }
  };

  setGlobal('document', mockDocument);
  setGlobal('window', {});

  function TestComponent() {
    latestState = useFullscreen();
    return null;
  }

  act(() => { TestRenderer.create(React.createElement(TestComponent)); });

  assert.equal(latestState.isFullscreen, false);

  await act(async () => { await latestState.enter(); });
  assert.equal(latestState.isFullscreen, true);
  assert.equal(latestState.error, null);

  await act(async () => { await latestState.exit(); });
  assert.equal(latestState.isFullscreen, false);
  
  await act(async () => { await latestState.toggle(); });
  assert.equal(latestState.isFullscreen, true);
});

test('useFullscreen falls back to vendor prefixes (webkit)', async () => {
  let latestState;
  let currentFullscreenElement = null;
  const listeners = {};

  const mockDocument = {
    addEventListener: (event, cb) => { listeners[event] = cb; },
    removeEventListener: (event, cb) => { if (listeners[event] === cb) delete listeners[event]; },
    get webkitFullscreenElement() { return currentFullscreenElement; },
    webkitExitFullscreen: async () => {
      currentFullscreenElement = null;
      if (listeners['webkitfullscreenchange']) listeners['webkitfullscreenchange']();
    },
    documentElement: {
      webkitRequestFullscreen: async () => {
        currentFullscreenElement = mockDocument.documentElement;
        if (listeners['webkitfullscreenchange']) listeners['webkitfullscreenchange']();
      }
    }
  };

  setGlobal('document', mockDocument);
  setGlobal('window', {});

  function TestComponent() {
    latestState = useFullscreen();
    return null;
  }

  act(() => { TestRenderer.create(React.createElement(TestComponent)); });

  await act(async () => { await latestState.enter(); });
  assert.equal(latestState.isFullscreen, true);

  await act(async () => { await latestState.exit(); });
  assert.equal(latestState.isFullscreen, false);
});

test('useFullscreen handles enter errors gracefully', async () => {
  let latestState;
  
  const mockDocument = {
    addEventListener: () => {},
    removeEventListener: () => {},
    get fullscreenElement() { return null; },
    documentElement: {
      requestFullscreen: async () => {
        throw new Error("Fullscreen API denied");
      }
    }
  };

  setGlobal('document', mockDocument);
  setGlobal('window', {});

  function TestComponent() {
    latestState = useFullscreen();
    return null;
  }

  act(() => { TestRenderer.create(React.createElement(TestComponent)); });

  await act(async () => { await latestState.enter(); });
  
  assert.equal(latestState.isFullscreen, false);
  assert.notEqual(latestState.error, null);
  assert.equal(latestState.error.message, "Fullscreen API denied");
});

test('useFullscreen removes listeners on unmount', () => {
  const listeners = {};
  const mockDocument = {
    addEventListener: (event, cb) => { listeners[event] = cb; },
    removeEventListener: (event, cb) => { if (listeners[event] === cb) delete listeners[event]; },
    get fullscreenElement() { return null; }
  };

  setGlobal('document', mockDocument);
  setGlobal('window', {});

  let latestState;
  function TestComponent() {
    latestState = useFullscreen();
    return null;
  }

  let root;
  act(() => {
    root = TestRenderer.create(React.createElement(TestComponent));
  });
  
  // Listeners should be attached
  assert.equal(typeof listeners['fullscreenchange'], 'function');
  
  act(() => {
    root.unmount();
  });
  
  // Listeners should be removed
  assert.equal(listeners['fullscreenchange'], undefined);
});
