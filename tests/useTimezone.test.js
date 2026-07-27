const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useTimezone } = hooks;

test('useTimezone resolves the timezone in browser', () => {
  const originalIntl = global.Intl;
  global.Intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  };

  let latestState;
  function TestComponent() {
    latestState = useTimezone();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState, 'America/New_York');

  global.Intl = originalIntl;
});
