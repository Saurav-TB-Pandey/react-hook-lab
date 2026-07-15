const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useElementSize } = hooks;

test('useElementSize returns width and height for an observed element', () => {
  let latestSize;
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
    latestSize = useElementSize(ref);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  act(() => {
    observerCallback([
      {
        contentRect: {
          width: 640,
          height: 360,
        },
      },
    ]);
  });

  assert.deepEqual(latestSize, { width: 640, height: 360 });
});
