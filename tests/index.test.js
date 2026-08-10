const { test } = require('node:test');
const assert = require('node:assert/strict');
const hooks = require('..');

test('package root exports all hooks and a default collection', () => {
  const expectedExports = [
    'createIndexedDB',
    'useAsync',
    'useAsyncDebounce',
    'useBoolean',
    'useCamera',
    'useClickOutside',
    'useClipboard',
    'useCookie',
    'useCounter',
    'useDebounce',
    'useDeepClone',
    'useDeepMemo',
    'useDownload',
    'useElementSize',
    'useFileSystem',
    'useFullscreen',
    'useIdle',
    'useIndexedDB',
    'useIntersectionObserver',
    'useInterval',
    'useLocalStorage',
    'useLocation',
    'useMicrophone',
    'useNotifications',
    'useOnlineStatus',
    'usePip',
    'usePrevious',
    'useRenderReason',
    'useResizeObserver',
    'useResource',
    'useSessionStorage',
    'useSharedState',
    'useThrottle',
    'useTimeout',
    'useTimezone',
    'useToggle',
    'useURL',
    'useWidth',
  ];

  for (const name of expectedExports) {
    assert.equal(typeof hooks[name], 'function', name);
    assert.equal(typeof hooks.default[name], 'function', `default.${name}`);
  }
});
