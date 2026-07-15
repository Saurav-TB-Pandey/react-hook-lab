const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useClickOutside } = hooks;

test('useClickOutside calls the handler only for outside targets', () => {
  const listeners = {};
  const insideTarget = {};
  const outsideTarget = {};
  const fakeElement = {
    contains: (target) => target === insideTarget,
  };
  let callCount = 0;

  setGlobal('document', {
    addEventListener: (eventName, listener) => {
      listeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete listeners[eventName];
    },
  });

  function TestComponent() {
    const ref = React.useRef(fakeElement);

    useClickOutside(ref, () => {
      callCount += 1;
    }, { events: ['mousedown'] });

    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  act(() => {
    listeners.mousedown({ target: insideTarget });
    listeners.mousedown({ target: outsideTarget });
  });

  assert.equal(callCount, 1);
});
