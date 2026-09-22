const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal } = require('../setup');
const { useTabVisibility, useInterval, usePrevious } = hooks;

test('Integration: useTabVisibility + useInterval + usePrevious creates a resilient tab-aware poller', () => {
  const docListeners = {};
  const winListeners = {};
  let visibilityState = 'visible';
  let hasFocusVal = true;

  setGlobal('document', {
    get visibilityState() {
      return visibilityState;
    },
    hasFocus: () => hasFocusVal,
    addEventListener: (event, cb) => {
      docListeners[event] = cb;
    },
    removeEventListener: (event) => {
      delete docListeners[event];
    },
  });

  setGlobal('window', {
    addEventListener: (event, cb) => {
      winListeners[event] = cb;
    },
    removeEventListener: (event) => {
      delete winListeners[event];
    },
  });

  let pollCount = 0;
  let latestPollerState;

  // Composite hook simulating a real-world auto-pausing polling dashboard
  function useTabAwarePoller(intervalMs) {
    const { isActive, wasActive, isVisible, isFocused } = useTabVisibility({
      requireWindowFocus: true,
    });

    const previousActive = usePrevious(isActive);

    const interval = useInterval(() => {
      if (isActive) {
        pollCount++;
      }
    }, intervalMs);

    return {
      isActive,
      wasActive,
      previousActive,
      isVisible,
      isFocused,
      isPolling: interval.isRunning(),
      stopPolling: interval.stop,
      startPolling: interval.start,
    };
  }

  function DashboardComponent() {
    latestPollerState = useTabAwarePoller(1000);
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(DashboardComponent));
  });

  assert.equal(latestPollerState.isActive, true);
  assert.equal(latestPollerState.isPolling, true);

  // 1. User switches tabs -> document becomes hidden
  visibilityState = 'hidden';
  act(() => {
    docListeners.visibilitychange();
  });

  assert.equal(latestPollerState.isActive, false);
  assert.equal(latestPollerState.wasActive, true);
  assert.equal(latestPollerState.isVisible, false);

  // 2. User returns to tab -> document visible
  visibilityState = 'visible';
  act(() => {
    docListeners.visibilitychange();
  });

  assert.equal(latestPollerState.isActive, true);
  assert.equal(latestPollerState.wasActive, false);
  assert.equal(latestPollerState.isVisible, true);

  // 3. User unfocuses window (e.g. typing in another window on monitor 2)
  act(() => {
    winListeners.blur();
  });

  assert.equal(latestPollerState.isActive, false);
  assert.equal(latestPollerState.isFocused, false);
  assert.equal(latestPollerState.isVisible, true);

  // 4. Regain focus
  act(() => {
    winListeners.focus();
  });

  assert.equal(latestPollerState.isActive, true);
  assert.equal(latestPollerState.isFocused, true);

  // 5. Clean teardown on unmount
  act(() => {
    latestPollerState.stopPolling();
    renderer.unmount();
  });

  assert.equal(Object.keys(docListeners).length, 0);
  assert.equal(Object.keys(winListeners).length, 0);
});
