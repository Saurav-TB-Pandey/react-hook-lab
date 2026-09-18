const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal, wait, createStorage } = require('../setup');
const { useIdle, useSessionStorage, useCookie, useToggle } = hooks;

test('Integration: useIdle + useSessionStorage + useCookie + useToggle coordinates inactivity session termination', async () => {
  const windowListeners = {};
  const fakeSessionStorage = createStorage({
    'auth:token': JSON.stringify('jwt-secret-xyz'),
  });

  const mockDocument = {
    cookie: 'auth_session=active-session-token',
  };

  setGlobal('sessionStorage', fakeSessionStorage);
  setGlobal('document', mockDocument);
  setGlobal('window', {
    addEventListener: (eventName, listener) => {
      windowListeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete windowListeners[eventName];
    },
  });

  let authManager;

  function AuthSessionManager() {
    const isIdle = useIdle(100);
    const [sessionToken, setSessionToken] = useSessionStorage('auth:token', null);
    const [authCookie, , deleteAuthCookie] = useCookie('auth_session');
    const {
      value: authStatus,
      setValue: setAuthStatus,
      toggle: toggleAuthStatus,
    } = useToggle('authenticated', 'logged_out');

    // Auto logout when user becomes idle
    React.useEffect(() => {
      if (isIdle && authStatus === 'authenticated') {
        setSessionToken(null);
        deleteAuthCookie();
        toggleAuthStatus();
      }
    }, [isIdle, authStatus, setSessionToken, deleteAuthCookie, toggleAuthStatus]);

    authManager = {
      isIdle,
      sessionToken,
      authCookie,
      authStatus,
      login: (token) => {
        setSessionToken(token);
        setAuthenticated();
      },
    };

    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(AuthSessionManager));
  });

  assert.equal(authManager.authStatus, 'authenticated');
  assert.equal(authManager.sessionToken, 'jwt-secret-xyz');
  assert.equal(authManager.authCookie, 'active-session-token');
  assert.equal(authManager.isIdle, false);

  // Await the 100ms idle threshold
  await act(async () => {
    await wait(150);
  });

  // User should now be idle and automatically logged out
  assert.equal(authManager.isIdle, true);
  assert.equal(authManager.authStatus, 'logged_out');
  assert.equal(authManager.sessionToken, null);
  assert.equal(fakeSessionStorage.getItem('auth:token'), 'null');
});
