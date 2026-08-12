const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { usePip } = hooks;

// Mock console.warn and console.error
const originalWarn = console.warn;
const originalError = console.error;

function setupMocks({ supported = true, failOpen = false, cssRulesThrow = false } = {}) {
  const pipListeners = {};
  
  const mockPipWindow = {
    document: {
      createElement: (tag) => {
        return { tag, id: '', textContent: '', rel: '', href: '', appendChild: () => {} };
      },
      body: {
        appendChild: () => {}
      },
      head: {
        appendChild: () => {}
      }
    },
    addEventListener: (event, cb) => { pipListeners[event] = cb; },
    close: () => {
      if (pipListeners['pagehide']) pipListeners['pagehide']();
    }
  };

  const mockDpip = {
    requestWindow: async (options) => {
      if (failOpen) throw new Error("Failed to open");
      mockDpip.window = mockPipWindow;
      return mockPipWindow;
    },
    window: null
  };

  const mockWindow = supported ? { documentPictureInPicture: mockDpip } : {};

  const mockDocument = {
    styleSheets: [
      {
        get cssRules() {
          if (cssRulesThrow) throw new Error("CORS error");
          return [{ cssText: 'body { color: red; }' }];
        },
        href: cssRulesThrow ? 'https://example.com/styles.css' : undefined
      }
    ]
  };

  setGlobal('window', mockWindow);
  setGlobal('document', mockDocument);

  return { mockPipWindow, pipListeners, mockDpip };
}

test('usePip returns correct isSupported', () => {
  setupMocks({ supported: true });
  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  assert.equal(latestState.isSupported, true);

  setupMocks({ supported: false });
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  assert.equal(latestState.isSupported, false);
});

test('usePip openPip warns and returns if unsupported', async () => {
  setupMocks({ supported: false });
  let warnings = [];
  console.warn = (msg) => warnings.push(msg);

  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  const result = await latestState.openPip();
  assert.equal(result, undefined);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0], "documentPictureInPicture is not supported in this browser.");

  console.warn = originalWarn;
});

test('usePip openPip successfully opens and sets up', async () => {
  const { mockPipWindow } = setupMocks({ supported: true });
  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  let win;
  await act(async () => {
    win = await latestState.openPip({ width: 300 });
  });

  assert.equal(win, mockPipWindow);
  assert.equal(latestState.isOpen, true);
});

test('usePip openPip copies styles', async () => {
  const { mockPipWindow } = setupMocks({ supported: true });
  let appendedElements = [];
  mockPipWindow.document.head.appendChild = (el) => appendedElements.push(el);

  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  await act(async () => {
    await latestState.openPip();
  });

  assert.equal(appendedElements.length, 1);
  assert.equal(appendedElements[0].tag, 'style');
  assert.equal(appendedElements[0].textContent, 'body { color: red; }');
});

test('usePip openPip copies styles with cross-origin fallback', async () => {
  const { mockPipWindow } = setupMocks({ supported: true, cssRulesThrow: true });
  let appendedElements = [];
  mockPipWindow.document.head.appendChild = (el) => appendedElements.push(el);

  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  await act(async () => {
    await latestState.openPip();
  });

  assert.equal(appendedElements.length, 1);
  assert.equal(appendedElements[0].tag, 'link');
  assert.equal(appendedElements[0].rel, 'stylesheet');
  assert.equal(appendedElements[0].href, 'https://example.com/styles.css');
});

test('usePip handles open error gracefully', async () => {
  setupMocks({ supported: true, failOpen: true });
  let errors = [];
  console.error = (msg, err) => errors.push(err);

  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  let caughtError;
  await act(async () => {
    try {
      await latestState.openPip();
    } catch (e) {
      caughtError = e;
    }
  });

  assert.notEqual(caughtError, undefined);
  assert.equal(caughtError.message, "Failed to open");
  assert.equal(errors.length, 1);
  assert.equal(latestState.isOpen, false);

  console.error = originalError;
});

test('usePip closePip closes window if open', async () => {
  const { mockPipWindow } = setupMocks({ supported: true });
  
  let closed = false;
  mockPipWindow.close = () => { closed = true; };

  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  await act(async () => {
    await latestState.openPip();
  });
  
  assert.equal(latestState.isOpen, true);

  act(() => {
    latestState.closePip();
  });

  assert.equal(closed, true);
});

test('usePip closes PIP and resets state on pagehide', async () => {
  const { pipListeners, mockPipWindow } = setupMocks({ supported: true });
  let latestState;
  function TestComponent() {
    latestState = usePip();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(TestComponent)); });
  
  await act(async () => {
    await latestState.openPip();
  });

  assert.equal(latestState.isOpen, true);

  act(() => {
    if (pipListeners['pagehide']) pipListeners['pagehide']();
  });

  assert.equal(latestState.isOpen, false);
});

test('usePip Pip component portals children only when open', async () => {
  // Mock react-dom's createPortal for ease of testing in this pure node environment.
  const ReactDOM = require('react-dom');
  const originalCreatePortal = ReactDOM.createPortal;
  ReactDOM.createPortal = (children, container) => {
    return React.createElement('div', { 'data-portal': true, container }, children);
  };

  setupMocks({ supported: true });
  let latestState;
  function TestComponent() {
    latestState = usePip();
    return React.createElement(latestState.Pip, { width: 300 }, React.createElement('span', { id: 'child' }, 'hello'));
  }
  
  let root;
  act(() => { root = TestRenderer.create(React.createElement(TestComponent)); });
  
  // Before open, portal should be empty (null)
  assert.equal(root.toJSON(), null);

  await act(async () => {
    await latestState.openPip();
  });

  // After open, it should render the portal mock
  const json = root.toJSON();
  assert.notEqual(json, null);
  assert.equal(json.props['data-portal'], true);
  assert.equal(json.children[0].type, 'span');
  assert.equal(json.children[0].children[0], 'hello');

  // Restore mock
  ReactDOM.createPortal = originalCreatePortal;
});
