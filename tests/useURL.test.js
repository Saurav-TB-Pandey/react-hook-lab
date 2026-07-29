const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useURL } = hooks;

test('useURL parses basic URL correctly', () => {
  // Mock window.location for test
  global.window = {
    location: {
      href: 'https://example.com/products/mobile/image.png?page=2&sort=name#preview',
      pathname: '/products/mobile/image.png',
      search: '?page=2&sort=name',
      hash: '#preview'
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    history: { pushState: () => {}, replaceState: () => {} }
  };

  let latestState;
  
  function TestComponent() {
    latestState = useURL();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.href, 'https://example.com/products/mobile/image.png?page=2&sort=name#preview');
  assert.equal(latestState.protocol, 'https:');
  assert.equal(latestState.host, 'example.com');
  assert.equal(latestState.hostname, 'example.com');
  assert.equal(latestState.pathname, '/products/mobile/image.png');
  assert.equal(latestState.hash, '#preview');
  assert.equal(latestState.search, '?page=2&sort=name');
  assert.equal(latestState.origin, 'https://example.com');
  
  // Query
  assert.deepEqual(latestState.query, { page: '2', sort: 'name' });
  
  // Segments
  assert.deepEqual(latestState.segments, ['products', 'mobile', 'image.png']);
  
  // Filename / Extension
  assert.equal(latestState.filename, 'image');
  assert.equal(latestState.extension, 'png');
  
  // Metadata
  assert.equal(latestState.parent, '/products/mobile');
  assert.equal(latestState.depth, 3);
  assert.equal(latestState.isHome, false);
  assert.equal(latestState.isSecure, true);
  
  // Breadcrumbs
  assert.equal(latestState.breadcrumbs.length, 4);
  assert.equal(latestState.breadcrumbs[0].name, 'Home');
  assert.equal(latestState.breadcrumbs[1].name, 'Products');
  assert.equal(latestState.breadcrumbs[3].name, 'Image.png');
});

test('useURL handles SSR gracefully', () => {
  // Simulate SSR by removing window
  const originalWindow = global.window;
  delete global.window;

  let latestState;
  function TestComponent() {
    latestState = useURL();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.href, '');
  assert.equal(latestState.isHome, true);
  assert.equal(latestState.segments.length, 0);

  // Restore window
  global.window = originalWindow;
});
