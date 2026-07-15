const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { wait } = require('./setup');
const { useDebounce } = hooks;

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
