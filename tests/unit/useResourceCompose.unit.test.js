const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { useResource, useResourceCompose } = require('../..');
const { __resetResourceRegistryForTests } = require('../../dist/src/data/useResource');
const { setGlobal, wait } = require('../setup.js');

beforeEach(() => {
  __resetResourceRegistryForTests();
  useResource.clearAll();
  setGlobal('window', {
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
});

afterEach(() => {
  useResource.clearAll();
  __resetResourceRegistryForTests();
});

test('useResourceCompose combines multiple resources into derived data', async () => {
  let composedState;

  function Parent() {
    const userRes = useResource({
      key: 'user:1',
      fetcher: async () => ({ id: 1, name: 'Alice' }),
      initialData: { id: 1, name: 'Alice' },
    });

    const roleRes = useResource({
      key: 'role:1',
      fetcher: async () => ({ role: 'Admin' }),
      initialData: { role: 'Admin' },
    });

    composedState = useResourceCompose({
      key: 'profile:1',
      deps: { user: userRes, role: roleRes },
      selector: ({ user, role }) => ({
        displayName: `${user?.name} (${role?.role})`,
        userId: user?.id,
      }),
    });

    return React.createElement('div', null, composedState.data?.displayName);
  }

  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Parent));
  });

  assert.equal(composedState.data.displayName, 'Alice (Admin)');
  assert.equal(composedState.data.userId, 1);
  assert.equal(composedState.loading, false);

  await act(async () => {
    renderer.unmount();
  });
  useResource.clearAll();
  __resetResourceRegistryForTests();
});

test('useResourceCompose updates derived state when a dependency mutates', async () => {
  let userResource;
  let composedState;

  function App() {
    userResource = useResource({
      key: 'user:counter',
      fetcher: async () => ({ count: 10 }),
      initialData: { count: 10 },
    });

    composedState = useResourceCompose({
      key: 'user:doubled',
      deps: { user: userResource },
      selector: ({ user }) => ({
        doubled: (user?.count ?? 0) * 2,
      }),
    });

    return React.createElement('div', null, String(composedState.data?.doubled));
  }

  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(App));
  });

  assert.equal(composedState.data.doubled, 20);

  // Mutate dependency and wait for reactive derivation
  await act(async () => {
    userResource.mutate((prev) => ({ count: (prev?.count ?? 0) + 5 }));
    await wait(20);
  });

  assert.equal(composedState.data.doubled, 30);

  await act(async () => {
    renderer.unmount();
  });
  useResource.clearAll();
  __resetResourceRegistryForTests();
});
