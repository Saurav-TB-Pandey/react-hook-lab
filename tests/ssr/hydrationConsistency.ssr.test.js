const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal } = require('../setup');

test('Hydration: useCookie matches server HTML on initial client render before synchronizing client cookie', () => {
  // 1. Server Phase: Render to HTML without document
  delete global.window;
  delete global.document;

  function CookieApp() {
    const [theme] = hooks.useCookie('theme', { initialValue: 'light' });
    return React.createElement('div', { id: 'theme-root' }, theme);
  }

  const serverHtml = renderToString(React.createElement(CookieApp));
  assert.match(serverHtml, /light/);

  // 2. Client Hydration Phase: Window and document exist with a different client cookie
  setGlobal('document', { cookie: 'theme=dark' });
  setGlobal('window', {});

  let clientRenders = [];

  function ClientCookieApp() {
    const [theme] = hooks.useCookie('theme', { initialValue: 'light' });
    clientRenders.push(theme);
    return React.createElement('div', { id: 'theme-root' }, theme);
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(ClientCookieApp));
  });

  // The initial client render MUST match the server HTML ('light') to prevent hydration mismatch!
  assert.equal(clientRenders[0], 'light');

  // After client effects run, it reconciles to the client cookie ('dark')
  assert.equal(clientRenders[clientRenders.length - 1], 'dark');
});

test('Hydration: useTimezone matches server null output on first render before resolving client timezone', () => {
  // 1. Server Phase
  delete global.window;
  delete global.document;

  function TimezoneApp() {
    const tz = hooks.useTimezone();
    return React.createElement('div', null, tz ?? 'loading-tz');
  }

  const serverHtml = renderToString(React.createElement(TimezoneApp));
  assert.match(serverHtml, /loading-tz/);

  // 2. Client Phase
  setGlobal('window', {});
  let renderedTzValues = [];

  function ClientTimezoneApp() {
    const tz = hooks.useTimezone();
    renderedTzValues.push(tz);
    return React.createElement('div', null, tz ?? 'loading-tz');
  }

  act(() => {
    TestRenderer.create(React.createElement(ClientTimezoneApp));
  });

  // First render on client must be null to match server render
  assert.equal(renderedTzValues[0], null);
  // Post-mount effect resolves the client timezone
  assert.equal(typeof renderedTzValues[renderedTzValues.length - 1], 'string');
});

test('Hydration: useLocalStorage renders initial fallback on server and synchronizes stored value on client', () => {
  // 1. Server Phase: Window and localStorage do not exist
  delete global.window;
  delete global.localStorage;

  function LocalStorageApp() {
    const [savedName] = hooks.useLocalStorage('user:name', 'Guest');
    return React.createElement('div', { id: 'user-root' }, `Welcome, ${savedName}`);
  }

  const serverHtml = renderToString(React.createElement(LocalStorageApp));
  assert.match(serverHtml, /Welcome, Guest/);

  // 2. Client Phase: localStorage is populated with a saved client value
  const { createStorage } = require('../setup');
  const fakeStorage = createStorage({
    'user:name': JSON.stringify('Saurav'),
  });
  setGlobal('localStorage', fakeStorage);
  setGlobal('window', {
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  let capturedNames = [];

  function ClientLocalStorageApp() {
    const [savedName] = hooks.useLocalStorage('user:name', 'Guest');
    capturedNames.push(savedName);
    return React.createElement('div', { id: 'user-root' }, `Welcome, ${savedName}`);
  }

  act(() => {
    TestRenderer.create(React.createElement(ClientLocalStorageApp));
  });

  // Client renders and has access to stored value
  assert.equal(capturedNames[capturedNames.length - 1], 'Saurav');
});

test('Hydration: useTabVisibility initializes baseline state without triggering activate/deactivate callbacks during hydration', () => {
  // 1. Server Phase
  delete global.window;
  delete global.document;

  let serverCallbacksFired = 0;
  function TabApp() {
    const tab = hooks.useTabVisibility({
      onActivate: () => { serverCallbacksFired++; },
      onDeactivate: () => { serverCallbacksFired++; },
    });
    return React.createElement('span', null, tab.isActive ? 'active' : 'inactive');
  }

  const serverHtml = renderToString(React.createElement(TabApp));
  assert.match(serverHtml, /active/);
  assert.equal(serverCallbacksFired, 0);

  // 2. Client Phase
  let clientCallbacksFired = 0;
  setGlobal('window', {
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  setGlobal('document', {
    visibilityState: 'visible',
    hasFocus: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  function ClientTabApp() {
    const tab = hooks.useTabVisibility({
      onActivate: () => { clientCallbacksFired++; },
      onDeactivate: () => { clientCallbacksFired++; },
    });
    return React.createElement('span', null, tab.isActive ? 'active' : 'inactive');
  }

  act(() => {
    TestRenderer.create(React.createElement(ClientTabApp));
  });

  // Mount synchronization must not trigger spurious callbacks during hydration
  assert.equal(clientCallbacksFired, 0);
});
