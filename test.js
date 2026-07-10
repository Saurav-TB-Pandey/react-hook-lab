const { afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('./index.js');

const {
  useAsync,
  useAsyncDebounce,
  useBoolean,
  useClickOutside,
  useClipboard,
  useCounter,
  useDebounce,
  useElementSize,
  useInterval,
  useIntersectionObserver,
  useLocalStorage,
  useOnlineStatus,
  usePrevious,
  useResizeObserver,
  useSessionStorage,
  useThrottle,
  useTimeout,
  useToggle,
  useWidth,
} = hooks;

const globalNames = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'IntersectionObserver',
  'ResizeObserver',
];

const originalGlobals = new Map(
  globalNames.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(global, name),
  ])
);

function setGlobal(name, value) {
  Object.defineProperty(global, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreGlobals() {
  for (const name of globalNames) {
    const descriptor = originalGlobals.get(name);

    if (descriptor) {
      Object.defineProperty(global, name, descriptor);
    } else {
      delete global[name];
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStorage(initial = {}) {
  const store = { ...initial };

  return {
    getItem: (key) =>
      Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    store,
  };
}

afterEach(() => {
  restoreGlobals();
});

test('package root exports all hooks and a default collection', () => {
  const expectedExports = [
    'useAsync',
    'useAsyncDebounce',
    'useBoolean',
    'useClickOutside',
    'useClipboard',
    'useCounter',
    'useDebounce',
    'useElementSize',
    'useInterval',
    'useIntersectionObserver',
    'useLocalStorage',
    'useOnlineStatus',
    'usePrevious',
    'useResizeObserver',
    'useSessionStorage',
    'useThrottle',
    'useTimeout',
    'useToggle',
    'useWidth',
  ];

  for (const name of expectedExports) {
    assert.equal(typeof hooks[name], 'function', name);
    assert.equal(typeof hooks.default[name], 'function', `default.${name}`);
  }
});

test('useDebounce delays updates and trims string values', async () => {
  let latestValue = '';
  let renderer;

  function TestComponent({ value, delay }) {
    latestValue = useDebounce(value, delay);
    return React.createElement('span', null, latestValue);
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(TestComponent, {
        value: '  hello  ',
        delay: 20,
      })
    );
  });

  assert.equal(renderer.toJSON().children[0], '  hello  ');

  await act(async () => {
    await wait(30);
  });

  assert.equal(renderer.toJSON().children[0], 'hello');
  assert.equal(latestValue, 'hello');
});

test('useThrottle emits the latest value after the throttle window', async () => {
  let latestValue = '';
  let renderer;

  function TestComponent({ value }) {
    latestValue = useThrottle(value, 20);
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(TestComponent, { value: 'first' })
    );
  });

  assert.equal(latestValue, 'first');

  act(() => {
    renderer.update(
      React.createElement(TestComponent, { value: 'second' })
    );
  });

  assert.equal(latestValue, 'first');

  await act(async () => {
    await wait(30);
  });

  assert.equal(latestValue, 'second');
});

test('useAsync executes immediately and stores resolved data', async () => {
  let latestState;
  let resolveAsync;
  const asyncFunction = () =>
    new Promise((resolve) => {
      resolveAsync = resolve;
    });

  function TestComponent() {
    latestState = useAsync(asyncFunction, []);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.loading, true);
  assert.equal(latestState.data, undefined);

  await act(async () => {
    resolveAsync('loaded');
    await wait(0);
  });

  assert.equal(latestState.loading, false);
  assert.equal(latestState.data, 'loaded');
  assert.equal(latestState.error, null);
});

test('useAsyncDebounce runs the callback after the delay', async () => {
  let latestState;
  const callback = async () => 'done';

  function TestComponent() {
    latestState = useAsyncDebounce(callback, 10);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.loading, false);

  await act(async () => {
    await wait(30);
  });

  assert.equal(latestState.result, 'done');
  assert.equal(latestState.loading, false);
  assert.equal(latestState.error, undefined);
});

test('useClipboard copies text and resets copied state', async () => {
  let latestState;
  let copiedText = '';

  setGlobal('navigator', {
    clipboard: {
      writeText: async (value) => {
        copiedText = value;
      },
    },
  });

  function TestComponent() {
    latestState = useClipboard(10);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  let success;
  await act(async () => {
    success = await latestState.copy('hello');
  });

  assert.equal(success, true);
  assert.equal(copiedText, 'hello');
  assert.equal(latestState.copied, true);
  assert.equal(latestState.error, null);

  await act(async () => {
    await wait(20);
  });

  assert.equal(latestState.copied, false);
});

test('useLocalStorage reads and writes JSON values', () => {
  const storage = createStorage({
    theme: JSON.stringify('dark'),
  });
  let latestState;

  setGlobal('window', {});
  setGlobal('localStorage', storage);

  function TestComponent() {
    latestState = useLocalStorage('theme', 'light');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'dark');

  act(() => {
    latestState[1]('light');
  });

  assert.equal(latestState[0], 'light');
  assert.equal(storage.store.theme, JSON.stringify('light'));
});

test('useSessionStorage reads and writes JSON values', () => {
  const storage = createStorage({
    draft: JSON.stringify('saved'),
  });
  let latestState;

  setGlobal('window', {});
  setGlobal('sessionStorage', storage);

  function TestComponent() {
    latestState = useSessionStorage('draft', '');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'saved');

  act(() => {
    latestState[1]('updated');
  });

  assert.equal(latestState[0], 'updated');
  assert.equal(storage.store.draft, JSON.stringify('updated'));
});

test('useOnlineStatus tracks browser online and offline events', () => {
  const listeners = {};
  let latestStatus;

  setGlobal('navigator', { onLine: false });
  setGlobal('window', {
    addEventListener: (eventName, listener) => {
      listeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete listeners[eventName];
    },
  });

  function TestComponent() {
    latestStatus = useOnlineStatus();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestStatus, false);

  act(() => {
    listeners.online();
  });

  assert.equal(latestStatus, true);

  act(() => {
    listeners.offline();
  });

  assert.equal(latestStatus, false);
});

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

test('useWidth reports initial width and updates on resize', async () => {
  const listeners = {};
  let latestWidth = 0;

  setGlobal('window', {
    innerWidth: 1024,
    addEventListener: (eventName, listener) => {
      listeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete listeners[eventName];
    },
    clearTimeout,
    setTimeout,
  });

  function TestComponent() {
    latestWidth = useWidth();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestWidth, 1024);

  global.window.innerWidth = 768;
  act(() => {
    listeners.resize();
  });

  await act(async () => {
    await wait(170);
  });

  assert.equal(latestWidth, 768);
});

test('useBoolean exposes setters and toggle helpers', () => {
  let latestState;

  function TestComponent() {
    latestState = useBoolean(false);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.value, false);

  act(() => {
    latestState.setTrue();
  });
  assert.equal(latestState.value, true);

  act(() => {
    latestState.toggle();
  });
  assert.equal(latestState.value, false);

  act(() => {
    latestState.setFalse();
  });
  assert.equal(latestState.value, false);
});

test('useCounter increments, decrements, clamps, sets, and resets', () => {
  let latestState;

  function TestComponent() {
    latestState = useCounter(2, {
      min: 0,
      max: 4,
      step: 2,
    });
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.count, 2);

  act(() => {
    latestState.increment();
  });
  assert.equal(latestState.count, 4);

  act(() => {
    latestState.increment();
  });
  assert.equal(latestState.count, 4);

  act(() => {
    latestState.decrement();
  });
  assert.equal(latestState.count, 2);

  act(() => {
    latestState.set(-10);
  });
  assert.equal(latestState.count, 0);

  act(() => {
    latestState.reset();
  });
  assert.equal(latestState.count, 2);
});

test('usePrevious returns the previous rendered value', () => {
  let latestPrevious;
  let renderer;

  function TestComponent({ value }) {
    latestPrevious = usePrevious(value, 'fallback');
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(TestComponent, { value: 'first' })
    );
  });

  assert.equal(latestPrevious, 'fallback');

  act(() => {
    renderer.update(
      React.createElement(TestComponent, { value: 'second' })
    );
  });

  assert.equal(latestPrevious, 'first');
});

test('useToggle switches between default and reverse values', () => {
  let latestState;

  function TestComponent() {
    latestState = useToggle('grid', 'list');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.value, 'grid');

  act(() => {
    latestState.toggle();
  });
  assert.equal(latestState.value, 'list');

  act(() => {
    latestState.toggle();
  });
  assert.equal(latestState.value, 'grid');
});

test('useTimeout starts automatically and can be restarted', async () => {
  let latestState;
  let callCount = 0;

  function TestComponent() {
    latestState = useTimeout(() => {
      callCount += 1;
    }, 10);
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.isActive(), true);

  await act(async () => {
    await wait(20);
  });

  assert.equal(callCount, 1);
  assert.equal(latestState.isActive(), false);

  act(() => {
    latestState.restart();
  });
  assert.equal(latestState.isActive(), true);

  act(() => {
    latestState.clear();
  });
  assert.equal(latestState.isActive(), false);
});

test('useInterval starts automatically and stops cleanly', async () => {
  let latestState;
  let callCount = 0;
  let renderer;

  function TestComponent() {
    latestState = useInterval(() => {
      callCount += 1;
    }, 10);
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.isRunning(), true);

  await act(async () => {
    await wait(35);
  });

  assert.ok(callCount >= 2);

  act(() => {
    latestState.stop();
  });

  const countAfterStop = callCount;

  await act(async () => {
    await wait(25);
  });

  assert.equal(callCount, countAfterStop);
  assert.equal(latestState.isRunning(), false);

  act(() => {
    renderer.unmount();
  });
});
