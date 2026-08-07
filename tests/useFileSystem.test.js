const { test, describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useFileSystem } = hooks;

describe('useFileSystem', () => {
  let latestState;
  
  function TestComponent() {
    latestState = useFileSystem();
    return null;
  }

  beforeEach(() => {
    setGlobal('window', {
      showOpenFilePicker: undefined,
      showSaveFilePicker: undefined,
    });
  });

  it('initializes correctly', () => {
    act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    assert.equal(latestState.status, 'idle');
    assert.equal(latestState.file, null);
    assert.equal(latestState.content, null);
    assert.equal(latestState.handle, null);
    assert.equal(latestState.error, null);
  });

  it('reports if API is supported', () => {
    setGlobal('window', { showOpenFilePicker: () => {} });
    
    act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });
    assert.equal(latestState.isSupported, true);

    setGlobal('window', { showOpenFilePicker: undefined });
    act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });
    assert.equal(latestState.isSupported, false);
  });

  it('handles open and save correctly', async () => {
    const mockWritable = {
      write: async (data) => {},
      close: async () => {}
    };
    
    const mockFile = {
      name: 'test.txt',
      size: 100,
      text: async () => 'Hello, world!',
    };

    const mockHandle = {
      kind: 'file',
      name: 'test.txt',
      getFile: async () => mockFile,
      createWritable: async () => mockWritable,
    };

    setGlobal('window', {
      showOpenFilePicker: async () => [mockHandle]
    });

    act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    await act(async () => {
      await latestState.open();
    });

    assert.equal(latestState.handle, mockHandle);
    assert.equal(latestState.file, mockFile);
    assert.equal(latestState.content, 'Hello, world!');
    assert.equal(latestState.status, 'idle');

    await act(async () => {
      await latestState.save('Updated content');
    });

    assert.equal(latestState.content, 'Updated content');
    assert.equal(latestState.status, 'idle');
  });

  it('handles saveAs correctly', async () => {
    const mockWritable = {
      write: async () => {},
      close: async () => {}
    };
    const mockFile = { name: 'new.txt', text: async () => 'Fresh content' };
    const mockHandle = {
      kind: 'file',
      name: 'new.txt',
      getFile: async () => mockFile,
      createWritable: async () => mockWritable,
    };

    setGlobal('window', {
      showOpenFilePicker: () => {}, // For isSupported true
      showSaveFilePicker: async () => mockHandle
    });

    act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    await act(async () => {
      await latestState.saveAs('Fresh content', { suggestedName: 'new.txt' });
    });

    assert.equal(latestState.handle, mockHandle);
    assert.equal(latestState.file, mockFile);
    assert.equal(latestState.content, 'Fresh content');
  });

  it('delegates save to saveAs when no file is open', async () => {
    let saveFilePickerCalledWith = null;
    const mockWritable = {
      write: async () => {},
      close: async () => {}
    };
    const mockFile = { name: 'untitled.txt', text: async () => 'Saved via fallback' };
    const mockHandle = {
      kind: 'file',
      name: 'untitled.txt',
      getFile: async () => mockFile,
      createWritable: async () => mockWritable,
    };

    setGlobal('window', {
      showOpenFilePicker: () => {}, // For isSupported true
      showSaveFilePicker: async (options) => {
        saveFilePickerCalledWith = options;
        return mockHandle;
      }
    });

    act(() => {
      TestRenderer.create(React.createElement(TestComponent));
    });

    // Call save without having an open file
    await act(async () => {
      await latestState.save('Saved via fallback', { description: 'Fallback Test' });
    });

    // Verify it called showSaveFilePicker with the dummy 'untitled' name and passed options
    assert.equal(saveFilePickerCalledWith.suggestedName, 'untitled');
    assert.equal(saveFilePickerCalledWith.description, 'Fallback Test');
    
    // Verify state updated properly like a saveAs call
    assert.equal(latestState.handle, mockHandle);
    assert.equal(latestState.file, mockFile);
    assert.equal(latestState.content, 'Saved via fallback');
  });
});
