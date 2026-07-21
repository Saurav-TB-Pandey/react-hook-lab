const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal, wait } = require('./setup');
const { useDownload } = hooks;

test('useDownload successfully downloads an object as JSON', async () => {
  let latestState;
  
  const mockLink = {
    click: () => {},
    remove: () => {},
    style: {}
  };
  
  setGlobal('window', {});
  setGlobal('document', {
    createElement: () => mockLink,
    body: { appendChild: () => {} }
  });
  setGlobal('URL', {
    createObjectURL: () => 'blob:test-url',
    revokeObjectURL: () => {}
  });
  setGlobal('Blob', class Blob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
    }
  });

  function TestComponent() {
    latestState = useDownload();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.status, 'idle');
  
  let result;
  await act(async () => {
    result = await latestState.download({ test: 123 }, 'export.json');
    await wait(200); // Wait for the URL.revokeObjectURL timeout
  });
  
  assert.equal(result, true);
  assert.equal(latestState.status, 'success');
  assert.equal(latestState.error, null);
  assert.equal(mockLink.download, 'export.json');
  assert.equal(mockLink.href, 'blob:test-url');
});

test('useDownload errors when no filename is provided', async () => {
  let latestState;
  setGlobal('window', {});
  setGlobal('document', {});

  function TestComponent() {
    latestState = useDownload();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });
  
  let result;
  await act(async () => {
    result = await latestState.download('some text', '');
  });
  
  assert.equal(result, false);
  assert.equal(latestState.status, 'error');
  assert.equal(latestState.error, 'A filename is required');
});
