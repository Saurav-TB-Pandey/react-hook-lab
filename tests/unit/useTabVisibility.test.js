const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal } = require('../setup');
const { useTabVisibility } = hooks;

test('useTabVisibility initializes baseline state without firing callbacks on mount', () => {
  const docListeners = {};
  const winListeners = {};
  let activatedCount = 0;
  let deactivatedCount = 0;
  let latestResult;

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

  function TestComponent() {
    latestResult = useTabVisibility({
      onActivate: () => activatedCount++,
      onDeactivate: () => deactivatedCount++,
    });
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestResult.isActive, true);
  assert.equal(latestResult.wasActive, undefined);
  assert.equal(latestResult.isVisible, true);
  assert.equal(latestResult.isFocused, true);
  assert.ok(latestResult.lastActiveAt > 0);
  assert.equal(latestResult.lastInactiveAt, null);
  assert.equal(activatedCount, 0, 'onActivate should not fire on initial baseline mount');
  assert.equal(deactivatedCount, 0, 'onDeactivate should not fire on initial baseline mount');
});

test('useTabVisibility handles visibilitychange, blur, focus, and mobile pagehide/pageshow', () => {
  const docListeners = {};
  const winListeners = {};
  let activatedCount = 0;
  let deactivatedCount = 0;
  let latestResult;

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

  function TestComponent({ requireWindowFocus }) {
    latestResult = useTabVisibility({
      requireWindowFocus,
      onActivate: () => activatedCount++,
      onDeactivate: () => deactivatedCount++,
    });
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent, { requireWindowFocus: true }));
  });

  assert.equal(latestResult.isActive, true);

  // 1. Tab switches to hidden
  visibilityState = 'hidden';
  act(() => {
    docListeners.visibilitychange();
  });

  assert.equal(latestResult.isActive, false);
  assert.equal(latestResult.wasActive, true);
  assert.equal(latestResult.isVisible, false);
  assert.equal(deactivatedCount, 1);
  assert.equal(activatedCount, 0);
  assert.ok(latestResult.lastInactiveAt > 0);

  // 2. Tab switches back to visible
  visibilityState = 'visible';
  act(() => {
    docListeners.visibilitychange();
  });

  assert.equal(latestResult.isActive, true);
  assert.equal(latestResult.wasActive, false);
  assert.equal(latestResult.isVisible, true);
  assert.equal(activatedCount, 1);
  assert.equal(deactivatedCount, 1);

  // 3. Window blurs (e.g. user clicks another window)
  act(() => {
    winListeners.blur();
  });

  assert.equal(latestResult.isActive, false);
  assert.equal(latestResult.isFocused, false);
  assert.equal(latestResult.isVisible, true);
  assert.equal(deactivatedCount, 2);

  // 4. Window regains focus
  act(() => {
    winListeners.focus();
  });

  assert.equal(latestResult.isActive, true);
  assert.equal(latestResult.isFocused, true);
  assert.equal(activatedCount, 2);

  // 5. Mobile pagehide event
  act(() => {
    winListeners.pagehide();
  });

  assert.equal(latestResult.isActive, false);
  assert.equal(latestResult.isVisible, false);
  assert.equal(deactivatedCount, 3);

  // 6. Mobile pageshow event
  act(() => {
    winListeners.pageshow({});
  });

  assert.equal(latestResult.isActive, true);
  assert.equal(latestResult.isVisible, true);
  assert.equal(activatedCount, 3);

  // 7. Test requireWindowFocus = false
  act(() => {
    renderer.update(React.createElement(TestComponent, { requireWindowFocus: false }));
  });

  act(() => {
    // Window blur should now be ignored for active computation
    winListeners.blur?.();
  });

  assert.equal(latestResult.isActive, true, 'Should stay active on blur when requireWindowFocus is false');

  // 8. Cleanup on unmount
  act(() => {
    renderer.unmount();
  });

  assert.equal(Object.keys(docListeners).length, 0);
  assert.equal(Object.keys(winListeners).length, 0);
});
