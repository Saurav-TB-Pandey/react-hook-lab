const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { usePrevious } = hooks;

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
