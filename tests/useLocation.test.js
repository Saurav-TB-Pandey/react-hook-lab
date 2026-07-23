const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useLocation } = hooks;

test('useLocation handles missing geolocation', () => {
  const originalNavigator = global.navigator;
  global.navigator = {}; // Mock no geolocation

  let latestState;
  
  function TestComponent() {
    latestState = useLocation();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.status, 'unsupported');

  global.navigator = originalNavigator;
});
