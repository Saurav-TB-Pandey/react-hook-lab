const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useResizeObserver } = hooks;

test('useResizeObserver returns element size from ResizeObserver', () => {
  let latestState;
  let observerCallback;
  const fakeElement = {};

  class MockResizeObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    observe() {}

    disconnect() {}
  }

  setGlobal('window', {
    ResizeObserver: MockResizeObserver,
  });
  setGlobal('ResizeObserver', MockResizeObserver);

  function TestComponent() {
    const ref = React.useRef(fakeElement);
    latestState = useResizeObserver(ref);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.deepEqual(latestState.size, { width: 0, height: 0 });

  act(() => {
    observerCallback([
      {
        contentRect: {
          width: 320,
          height: 180,
        },
      },
    ]);
  });

  assert.equal(latestState.width, 320);
  assert.equal(latestState.height, 180);
  assert.deepEqual(latestState.size, { width: 320, height: 180 });
});
