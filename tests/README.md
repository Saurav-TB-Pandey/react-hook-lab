# Testing Guide - React Hook Lab

`react-hook-lab` relies strictly on the **native Node.js test runner** (`node:test` and `node:assert/strict`) together with `react-test-renderer`. No third-party test frameworks (Jest, Vitest, Mocha) are used, keeping dependencies minimal and execution blazing fast.

---

## 1. Directory Structure

```text
tests/
├── README.md                 # This testing guide
├── setup.js                  # Global test environment, mocking helpers & auto-cleanup
├── unit/                     # Isolated tests for individual hooks & utilities
│   ├── deepEqual.unit.test.js
│   ├── useAsync.unit.test.js
│   ├── useDebounce.unit.test.js
│   └── ... (42 test files)
├── integration/              # Multi-hook composite workflow tests
│   ├── asyncSearchTimeoutRetry.integration.test.js
│   ├── autosaveStorageDebounce.integration.test.js
│   ├── counterThrottlePrevious.integration.test.js
│   ├── modalClickOutsideClipboard.integration.test.js
│   ├── offlineNotificationSync.integration.test.js
│   ├── responsiveContainerLayout.integration.test.js
│   ├── sessionAuthIdleTimeout.integration.test.js
│   └── tabVisibilityPoller.integration.test.js
└── ssr/                      # Dedicated Server-Side Rendering (SSR) & hydration tests (1 file per hook/utility)
    ├── hydrationConsistency.ssr.test.js
    ├── useAsync.ssr.test.js
    ├── useLocalStorage.ssr.test.js
    ├── useTabVisibility.ssr.test.js
    └── ... (42 test files)
```

---

## 2. Test Execution Commands

| Command | Purpose |
| :--- | :--- |
| `npm test` | Runs the entire test suite (unit, integration, and SSR tests). |
| `npm run test:unit` | Runs only unit tests under `tests/unit/*.unit.test.js`. |
| `npm run test:integration` | Runs only composite integration tests under `tests/integration/*.integration.test.js`. |
| `npm run test:ssr` | Runs dedicated SSR & hydration tests under `tests/ssr/*.ssr.test.js`. |
| `node --test tests/unit/useToggle.unit.test.js` | Runs a specific unit test file in isolation. |
| `node --test tests/integration/sessionAuthIdleTimeout.integration.test.js` | Runs a specific integration test file in isolation. |
| `node --test tests/ssr/hydrationConsistency.ssr.test.js` | Runs a specific SSR hydration test file in isolation. |

---

## 3. Shared Test Setup (`tests/setup.js`)

Because tests run in Node.js where DOM and Web APIs are not natively available, [`tests/setup.js`](./setup.js) provides utilities to safely mock browser environments and prevent test cross-contamination:

- **`setGlobal(name, value)`**: Safely defines/replaces a global property (e.g. `window`, `document`, `navigator`, `localStorage`, `ResizeObserver`).
- **`restoreGlobals()`**: Automatically invoked in an `afterEach` hook to clean up mocked globals so that state from one test never leaks into another.
- **`createStorage(initialData)`**: Returns a compliant in-memory mock of the Web `Storage` interface (`getItem`, `setItem`, `removeItem`, `clear`).
- **`wait(ms)`**: Promise-based timer delay for testing debounce delays, throttle windows, or async updates.

---

## 4. Writing Unit Tests (`tests/unit/<hookName>.unit.test.js`)

Each hook in `src/` must have a dedicated unit test file in `tests/unit/`.

### Unit Test Template
```javascript
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal } = require('../setup');
const { useYourHook } = hooks;

test('useYourHook initializes with default state and handles updates', () => {
  let latestState;

  function TestComponent() {
    latestState = useYourHook('initial');
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.value, 'initial');

  act(() => {
    latestState.update('next');
  });

  assert.equal(latestState.value, 'next');
});
```

---

## 5. Writing Integration Tests (`tests/integration/<flowName>.integration.test.js`)

Integration tests verify how multiple hooks interact in realistic application workflows (e.g., debouncing form input into storage, or coordinating inactivity detection with session logout).

### Integration Test Template
```javascript
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { wait, setGlobal, createStorage } = require('../setup');
const { useHookA, useHookB, useHookC } = hooks;

test('Integration: useHookA + useHookB + useHookC coordinates realistic workflow', async () => {
  // 1. Setup mocked browser environment (if required)
  const fakeStorage = createStorage();
  setGlobal('localStorage', fakeStorage);

  let workflowState;

  // 2. Compose multiple hooks in a single consumer component
  function CompositeWorkflowComponent() {
    const stateA = useHookA();
    const stateB = useHookB(stateA);
    const stateC = useHookC();

    workflowState = { stateA, stateB, stateC };
    return null;
  }

  // 3. Render and assert collaborative behavior
  act(() => {
    TestRenderer.create(React.createElement(CompositeWorkflowComponent));
  });

  // 4. Exercise user interactions / timers across hooks
  await act(async () => {
    workflowState.stateA.trigger();
    await wait(50);
  });

  assert.equal(workflowState.stateB.isSynchronized, true);
});
```

---

## 6. Writing SSR & Hydration Tests (`tests/ssr/<category>.ssr.test.js`)

SSR tests guarantee Next.js, Remix, and Astro compatibility using `react-dom/server`'s `renderToString`:

```javascript
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

test('SSR: useYourHook renders safe fallback on server without browser globals', () => {
  delete global.window;
  delete global.document;

  let renderedState;
  function Component() {
    renderedState = hooks.useYourHook('fallback');
    return React.createElement('div', null, renderedState.value);
  }

  const html = renderToString(React.createElement(Component));
  assert.match(html, /fallback/);
  assert.equal(renderedState.value, 'fallback');
});
```

---

## 7. Testing Best Practices

1. **Wrap All State Updates in `act()`**: Always use `act()` or `await act(async () => ...)` when mounting, triggering events, or waiting for timers to ensure React finishes flush cycles.
2. **SSR & Hydration Safety**: Test that browser hooks do not access `window` or `document` during the initial server render pass.
3. **Timer & Listener Cleanup**: If your hook uses `setInterval`, `setTimeout`, or adds event listeners, verify that unmounting the component cleans them up without leaving hanging timers on Node's event loop.
4. **Isolated Globals**: Use `setGlobal` rather than directly assigning to `global.<name>` so that `restoreGlobals()` cleans it up automatically after each test.
