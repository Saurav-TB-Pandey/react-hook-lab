const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToString } = require('react-dom/server');
const hooks = require('../..');

function ensureCleanSSR() {
  delete global.window;
  delete global.document;
}

test('SSR: useResourceCompose combines resources safely on server', () => {
  ensureCleanSSR();
  let composedResult;

  function App() {
    const userRes = hooks.useResource({
      key: 'ssr-compose-user',
      fetcher: async () => ({ id: 42, name: 'Saurav' }),
      initialData: { id: 42, name: 'Saurav' },
    });

    composedResult = hooks.useResourceCompose({
      key: 'ssr-composed',
      deps: { user: userRes },
      selector: ({ user }) => ({ userId: user?.id, displayName: user?.name }),
    });

    return React.createElement('div', null, `user:${composedResult.data?.userId}`);
  }

  const html = renderToString(React.createElement(App));
  assert.match(html, /user:42/);
  assert.deepEqual(composedResult.data, { userId: 42, displayName: 'Saurav' });
});
