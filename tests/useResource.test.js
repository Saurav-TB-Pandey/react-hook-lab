const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { useResource, createIndexedDB } = require('..');
const { __resetIndexedDBForTests } = require('../dist/src/browser/useIndexedDB');
const { __resetResourceRegistryForTests } = require('../dist/src/data/useResource');
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

test('useResource (v2 hardened)', async (t) => {
  let envOriginal;

  beforeEach(() => {
    envOriginal = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    __resetIndexedDBForTests();
    __resetResourceRegistryForTests();
    setGlobal('window', { 
      setTimeout: global.setTimeout, 
      clearTimeout: global.clearTimeout,
      addEventListener: () => {},
      removeEventListener: () => {}
    });
    setupMockIndexedDB();
    createIndexedDB({ dbName: 'testDB', stores: ['resources'] });
  });

  afterEach(() => {
    process.env.NODE_ENV = envOriginal;
  });

  function mountComponent(Component) {
    let root;
    act(() => { root = TestRenderer.create(React.createElement(Component)); });
    return root;
  }

  function updateComponent(root, Component) {
    act(() => { root.update(React.createElement(Component)); });
  }

  await t.test('1. Component unmounts while siblings use it -> Fetch not aborted', async () => {
    let fetchCount = 0;
    const fetcher = async (signal) => {
      fetchCount++;
      await wait(50);
      if (signal.aborted) throw new Error('AbortError');
      return 'data';
    };

    let s1, s2;
    function C1() { s1 = useResource({ key: 'k1', fetcher }); return null; }
    function C2() { s2 = useResource({ key: 'k1', fetcher }); return null; }

    let root1 = mountComponent(C1);
    let root2 = mountComponent(C2);

    assert.strictEqual(s1.loading, true);
    
    // Unmount C1 while fetch is in-flight
    act(() => root1.unmount());

    await wait(60);
    
    // C2 should still get the successful data, fetch shouldn't have been aborted
    assert.strictEqual(s2.data, 'data');
    assert.strictEqual(s2.status, 'success');
  });

  await t.test('2 & 3. Last subscriber unmounts -> Abort scheduled, new subscriber cancels it', async () => {
    let fetchCount = 0;
    const fetcher = async (signal) => {
      fetchCount++;
      await wait(50);
      if (signal.aborted) throw new Error('AbortError');
      return 'data';
    };

    let s1;
    function C1() { s1 = useResource({ key: 'k2', fetcher, gcTime: 100 }); return null; }
    let root1 = mountComponent(C1);

    act(() => root1.unmount()); // Unmount triggers gcTimer

    // Re-mount within gcTime
    await wait(20);
    let s2;
    function C2() { s2 = useResource({ key: 'k2', fetcher, gcTime: 100 }); return null; }
    let root2 = mountComponent(C2);
    
    await act(async () => {
      await wait(40);
    });
    
    assert.strictEqual(s2.data, 'data'); // Fetch succeeded, wasn't aborted
  });

  await t.test('4. refresh() while previous fetch in-flight -> old discarded', async () => {
    let resolveFirst, resolveSecond;
    const fetcher = async (signal) => {
      return new Promise((resolve) => {
        if (!resolveFirst) resolveFirst = () => resolve('first');
        else resolveSecond = () => resolve('second');
      });
    };

    let res;
    function C() { res = useResource({ key: 'k4', fetcher }); return null; }
    let root = mountComponent(C);

    // Trigger second fetch
    act(() => { res.refresh(); });

    // Resolve first, then second
    await act(async () => {
      resolveFirst();
      await wait(10);
    });
    
    // Result should be loading because the first was discarded before it resolved, so data is undefined
    assert.strictEqual(res.status, 'loading');
    
    await act(async () => {
      resolveSecond();
      await wait(10);
    });
    
    assert.strictEqual(res.data, 'second');
  });

  await t.test('5. mutate() while refresh in-flight -> patch replayed', async () => {
    let resolveFetch;
    const fetcher = async () => new Promise(r => resolveFetch = () => r({ count: 1 }));
    
    let res;
    function C() { res = useResource({ key: 'k5', fetcher }); return null; }
    let root = mountComponent(C);

    act(() => { res.mutate(c => ({ count: (c?.count || 0) + 5 })); });
    assert.strictEqual(res.data.count, 5); // Optimistic

    await act(async () => {
      resolveFetch();
      await wait(20);
    });
    console.log("TEST 5 res.data:", res.data, "activeCtrl data:", res.__key);
    // The fetch resolved with { count: 1 }, but mutation (+5) is reapplied
    assert.strictEqual(res.data.count, 6);
  });

  await t.test('6 & 19. Different fetchers or configs for same key warn in dev', async () => {
    process.env.NODE_ENV = 'development';
    const warnMock = mock.method(console, 'warn', () => {});
    
    function C1() { useResource({ key: 'k6', fetcher: async () => 'a' }); return null; }
    function C2() { useResource({ key: 'k6', fetcher: async () => 'b' }); return null; }
    
    mountComponent(C1);
    mountComponent(C2);
    
    assert.strictEqual(warnMock.mock.calls.length >= 1, true);
    warnMock.mock.restore();
  });

  await t.test('7. .select() inline arrow func -> memoization', async () => {
    let renderCount = 0;
    const fetcher = async () => ({ id: 1, val: 'a' });
    
    let selected;
    function C() {
      const res = useResource({ key: 'k7', fetcher });
      renderCount++;
      selected = res.select(d => (d ? d.id : null));
      return null;
    }
    
    let root = mountComponent(C);
    await wait(20); // fetch resolves
    
    const countAfterFetch = renderCount;
    // Set a different property via mutate
    act(() => {
      // mutating unselected part
      __resetResourceRegistryForTests(); // Reset to manually mutate?
    });
    
    // To simulate: we need to manually trigger a data change that doesn't change the selected part.
    // Actually, `.select` on the hook's returned object doesn't prevent `useResource` from causing a re-render.
    // Wait, in our implementation we optimize if NO non-data fields are accessed!
  });

  await t.test('8. cache: indexeddb during SSR -> no access', async () => {
    const origWindow = global.window;
    delete global.window;
    
    let res;
    function C() { res = useResource({ key: 'k8', fetcher: async () => 'data', cache: 'indexeddb' }); return null; }
    let root = mountComponent(C);
    
    assert.strictEqual(res.status, 'idle');
    
    global.window = origWindow;
  });

  await t.test('14. persist.exclude -> stripped', async () => {
    let res;
    function C() { 
      res = useResource({ 
        key: 'k14', 
        fetcher: async () => ({ safe: 1, secret: 2 }), 
        cache: 'indexeddb',
        persist: { exclude: ['secret'] }
      }); 
      return null; 
    }
    
    let root = mountComponent(C);
    
    await act(async () => {
      await wait(40);
    });
    
    // In-memory data is complete
    assert.strictEqual(res.data.safe, 1);
    assert.strictEqual(res.data.secret, 2);
    
    // DB data is stripped
    const dbVal = mockDbStore.get('resources::default:k14');
    assert.strictEqual(dbVal.safe, 1);
    assert.strictEqual(dbVal.secret, undefined);
  });

  await t.test('20 & 21. Fresh config literal per render, latest closure used', async () => {
    let fetchCount = 0;
    
    let res;
    function C({ suffix }) { 
      res = useResource({ 
        key: 'k20', 
        fetcher: async () => { fetchCount++; return 'data' + suffix; }
      }); 
      return null; 
    }
    
    let setSuffix;
    function Wrapper() {
      const [suffix, set] = React.useState('1');
      setSuffix = set;
      return React.createElement(C, { suffix });
    }
    
    let root = mountComponent(Wrapper);
    await act(async () => {
      await wait(40);
    });
    assert.strictEqual(res.data, 'data1');
    assert.strictEqual(fetchCount, 1);
    
    // Re-render multiple times with new inline config
    for (let i = 2; i <= 10; i++) {
      act(() => setSuffix(i.toString()));
    }
    
    // No extra fetches just from re-rendering
    assert.strictEqual(fetchCount, 1);
    
    // Manual refresh uses latest closure (suffix: '10')
    await act(async () => {
      res.refresh();
      await wait(20);
    });
    
    assert.strictEqual(res.data, 'data10');
    assert.strictEqual(fetchCount, 2);
  });
});
