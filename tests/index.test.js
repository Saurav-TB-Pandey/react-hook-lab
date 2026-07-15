const { test } = require('node:test');
const assert = require('node:assert/strict');
const hooks = require('..');

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
