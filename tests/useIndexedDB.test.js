const { test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { useIndexedDB, createIndexedDB, __resetIndexedDBForTests } = require('..');
const { setGlobal, wait } = require('./setup.js');

let mockDbStore = new Map();

function setupMockIndexedDB() {
  mockDbStore = new Map();
  
  const mockObjectStore = (storeName) => ({
    get: (key) => {
      const request = {};
      setTimeout(() => {
        request.result = mockDbStore.get(`${storeName}::${key}`);
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    },
    put: (value, key) => {
      mockDbStore.set(`${storeName}::${key}`, value);
      const request = {};
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess();
      }, 0);
      return request;
    },
    delete: (key) => {
      mockDbStore.delete(`${storeName}::${key}`);
      return {};
    }
  });

  const mockTx = (storeName) => {
    const tx = {
      objectStore: () => mockObjectStore(storeName),
      error: null
    };
    setTimeout(() => {
      if (tx.oncomplete) tx.oncomplete();
    }, 5);
    return tx;
  };

  const mockDB = {
    objectStoreNames: { contains: () => true },
    transaction: (storeName, mode) => mockTx(storeName),
    createObjectStore: () => {}
  };

  const mockIndexedDB = {
    open: () => {
      const request = {};
      setTimeout(() => {
        request.result = mockDB;
        if (request.onupgradeneeded) request.onupgradeneeded();
        if (request.onsuccess) request.onsuccess();
      }, 5);
      return request;
    }
  };

  setGlobal('indexedDB', mockIndexedDB);
  
  class MockBroadcastChannel {
    constructor() { this.name = 'mock'; }
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  }
  setGlobal('BroadcastChannel', MockBroadcastChannel);
}

test('useIndexedDB', async (t) => {
  beforeEach(() => {
    __resetIndexedDBForTests();
    setupMockIndexedDB();
    createIndexedDB({ dbName: 'testDB', stores: ['testStore'] });
  });

  await t.test('loads initial value and then data from DB', async () => {
    mockDbStore.set('testStore::testKey', 'db-value');
    
    let latestState;
    function TestComponent() {
      latestState = useIndexedDB('testStore', 'testKey', 'default-value');
      return null;
    }

    let root;
    act(() => {
      root = TestRenderer.create(React.createElement(TestComponent));
    });
    
    let [val, setVal, meta] = latestState;
    assert.strictEqual(val, 'default-value');
    assert.strictEqual(meta.status, 'loading');

    await wait(20);
    
    act(() => {
      root.update(React.createElement(TestComponent));
    });

    [val, setVal, meta] = latestState;
    assert.strictEqual(val, 'db-value');
    assert.strictEqual(meta.status, 'ready');
  });
  
  await t.test('writes to DB and updates local state', async () => {
    let latestState;
    function TestComponent() {
      latestState = useIndexedDB('testStore', 'writeKey', 'default-value');
      return null;
    }

    let root;
    act(() => {
      root = TestRenderer.create(React.createElement(TestComponent));
    });
    
    await wait(20);
    act(() => {
      root.update(React.createElement(TestComponent));
    });

    let [val, setVal, meta] = latestState;
    
    act(() => {
      setVal('new-value');
    });
    
    act(() => {
      root.update(React.createElement(TestComponent));
    });

    [val, setVal, meta] = latestState;
    assert.strictEqual(val, 'new-value'); // Optimistic local update
    
    await wait(20);
    assert.strictEqual(mockDbStore.get('testStore::writeKey'), 'new-value');
  });

  await t.test('deletes from DB and resets to initial value', async () => {
    let latestState;
    function TestComponent() {
      latestState = useIndexedDB('testStore', 'deleteKey', 'default-value');
      return null;
    }

    let root;
    act(() => {
      root = TestRenderer.create(React.createElement(TestComponent));
    });
    
    await wait(20);
    act(() => {
      root.update(React.createElement(TestComponent));
    });

    let [val, setVal, meta] = latestState;
    
    act(() => {
      setVal('new-value');
    });
    
    await wait(20);
    
    act(() => {
      latestState[2].remove();
    });
    
    await wait(20);
    act(() => {
      root.update(React.createElement(TestComponent));
    });

    const [finalVal, , finalMeta] = latestState;
    assert.strictEqual(finalVal, 'default-value');
    assert.strictEqual(mockDbStore.has('testStore::deleteKey'), false);
  });
});
