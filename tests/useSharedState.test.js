const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useSharedState } = hooks;

test('useSharedState initializes, reads, and updates state', () => {
  let latestState;
  
  function TestComponent() {
    latestState = hooks.useSharedState('test-key', 'initial');
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState[0], 'initial');

  act(() => {
    latestState[1]('updated');
  });

  assert.equal(latestState[0], 'updated');
});

test('useSharedState respects enabled flag', () => {
  let latestStateA;
  let latestStateB;
  
  function TestComponentA() {
    latestStateA = hooks.useSharedState('test-enabled', 'initial', { enabled: true });
    return null;
  }

  function TestComponentB() {
    latestStateB = hooks.useSharedState('test-enabled', 'initial', { enabled: false });
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement('div', null, React.createElement(TestComponentA), React.createElement(TestComponentB)));
  });

  assert.equal(latestStateA[0], 'initial');
  assert.equal(latestStateB[0], 'initial');

  act(() => {
    latestStateA[1]('updated');
  });

  // A should update
  assert.equal(latestStateA[0], 'updated');
  // B should NOT receive the update because it is disabled
  assert.equal(latestStateB[0], 'initial');
});
