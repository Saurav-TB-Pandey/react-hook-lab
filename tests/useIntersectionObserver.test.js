const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useIntersectionObserver } = hooks;

test('useIntersectionObserver returns intersection state', () => {
  let latestState;
  let observerCallback;
  let observedElement;
  let disconnected = false;
  const fakeElement = {};

  class MockIntersectionObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    observe(element) {
      observedElement = element;
    }

    disconnect() {
      disconnected = true;
    }
  }

  setGlobal('window', {
    IntersectionObserver: MockIntersectionObserver,
  });
  setGlobal('IntersectionObserver', MockIntersectionObserver);

  function TestComponent() {
    const ref = React.useRef(fakeElement);
    latestState = useIntersectionObserver(ref);
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(observedElement, fakeElement);
  assert.equal(latestState.isIntersecting, false);

  act(() => {
    observerCallback([
      {
        isIntersecting: true,
        target: fakeElement,
      },
    ]);
  });

  assert.equal(latestState.isIntersecting, true);

  act(() => {
    renderer.unmount();
  });

  assert.equal(disconnected, true);
});
