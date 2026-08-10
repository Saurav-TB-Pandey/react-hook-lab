const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useCookie } = hooks;

test('useCookie strict string hydration safe', async (t) => {
  const originalDocument = global.document;

  t.afterEach(() => {
    global.document = originalDocument;
  });

  await t.test('SSR hydration matching: returns initialValue on first render', () => {
    setGlobal('document', { cookie: "theme=dark" }); 
    let renderCount = 0;
    let values = [];

    function TestComponent() {
      renderCount++;
      const [val] = useCookie('theme', { initialValue: 'light' });
      values.push(val);
      return null;
    }

    act(() => { TestRenderer.create(React.createElement(TestComponent)); });

    assert.equal(values[0], 'light');
    assert.equal(values[values.length - 1], 'dark');
  });

  await t.test('SSR hydration matching: missing cookie returns initialValue', () => {
    setGlobal('document', { cookie: "" }); 
    let values = [];

    function TestComponent() {
      const [val] = useCookie('theme', { initialValue: 'dark' });
      values.push(val);
      return null;
    }

    act(() => { TestRenderer.create(React.createElement(TestComponent)); });

    assert.equal(values[0], 'dark');
    assert.equal(values[values.length - 1], 'dark');
  });

  await t.test('empty cookie returns "" correctly', () => {
    setGlobal('document', { cookie: "theme=" }); 
    let values = [];

    function TestComponent() {
      const [val] = useCookie('theme');
      values.push(val);
      return null;
    }

    act(() => { TestRenderer.create(React.createElement(TestComponent)); });

    assert.equal(values[values.length - 1], '');
  });

  await t.test('cookie without equals sign is ignored gracefully', () => {
    setGlobal('document', { cookie: "theme; other=val" }); 
    let values = [];

    function TestComponent() {
      const [val] = useCookie('theme');
      values.push(val);
      return null;
    }

    act(() => { TestRenderer.create(React.createElement(TestComponent)); });

    assert.equal(values[values.length - 1], undefined);
  });

  await t.test('updates the cookie and state successfully', () => {
    setGlobal('document', { cookie: "" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('theme', { initialValue: 'initial' });
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    act(() => {
      latestState[1]('newValue');
    });

    assert.equal(latestState[0], 'newValue');
    assert.ok(global.document.cookie.includes('theme=newValue'));
  });

  await t.test('strict string evaluation (no auto JSON parse)', () => {
    setGlobal('document', { cookie: "count=123" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('count');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    assert.equal(latestState[0], '123'); 
  });

  await t.test('ignores gracefully if URI decoding fails', () => {
    setGlobal('document', { cookie: "malformed=%E0%A4%A" }); 
    let latestState;
    function TestComponent() {
      latestState = useCookie('malformed', { initialValue: 'fallback' });
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    assert.equal(latestState[0], 'fallback');
  });

  await t.test('option conflicts throw error', () => {
    setGlobal('document', { cookie: "" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('test');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    assert.throws(() => {
      act(() => {
        latestState[1]('val', { days: 1, maxAgeSeconds: 3600 });
      });
    }, /Conflicting expiration options/);
  });

  await t.test('invalid numeric and date options throw error', () => {
    setGlobal('document', { cookie: "" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('test');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    assert.throws(() => {
      act(() => { latestState[1]('val', { days: NaN }); });
    }, /days must be a finite number/);

    assert.throws(() => {
      act(() => { latestState[1]('val', { days: Number.MAX_VALUE }); });
    }, /days produces an invalid expiration date/);

    assert.throws(() => {
      act(() => { latestState[1]('val', { maxAgeSeconds: 1.5 }); });
    }, /maxAgeSeconds must be a finite integer/);

    assert.throws(() => {
      act(() => { latestState[1]('val', { expires: new Date("invalid") }); });
    }, /expires must be a valid Date/);

    // Should NOT throw for negative or fractional days
    act(() => { latestState[1]('val', { days: -1 }); });
    act(() => { latestState[1]('val', { days: 0.5 }); });
  });

  await t.test('sameSite none requires secure', () => {
    setGlobal('document', { cookie: "" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('test');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    assert.throws(() => {
      act(() => {
        latestState[1]('val', { sameSite: 'none', secure: false });
      });
    }, /sameSite: 'none' requires secure: true/);
  });

  await t.test('cookie size limit protection (including Unicode)', () => {
    setGlobal('document', { cookie: "" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('huge');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    const massiveString = "a".repeat(5000);
    assert.throws(() => {
      act(() => {
        latestState[1](massiveString);
      });
    }, /Cookie exceeds the configured 4096-byte safety limit/);

    const heavyUnicode = "😀".repeat(1025); // 4 bytes each = 4100 bytes, plus `huge=` etc
    assert.throws(() => {
      act(() => {
        latestState[1](heavyUnicode);
      });
    }, /Cookie exceeds the configured 4096-byte safety limit/);
  });

  await t.test('invalid cookie name protection', () => {
    setGlobal('document', { cookie: "" });
    let latestState;
    function TestComponent() {
      latestState = useCookie('bad=name;');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    assert.throws(() => {
      act(() => {
        latestState[1]('val');
      });
    }, /Invalid cookie name/);
  });

  await t.test('deletes the cookie correctly with domain and path', () => {
    let internalCookie = "target=val";
    const mockDocument = {
      get cookie() { return internalCookie; },
      set cookie(val) { 
        if (val.includes('max-age=0')) {
          internalCookie = "";
        } else {
          internalCookie = val; 
        }
      }
    };
    setGlobal('document', mockDocument);

    let latestState;
    function TestComponent() {
      latestState = useCookie('target');
      return null;
    }
    act(() => { TestRenderer.create(React.createElement(TestComponent)); });
    
    act(() => {
      latestState[2]({ path: '/app', domain: 'example.com' });
    });

    assert.equal(latestState[0], undefined);
  });

  await t.test('changing key dynamically resyncs state', () => {
    setGlobal('document', { cookie: "keyA=valA; keyB=valB" });
    
    let latestState;
    function TestComponent({ cookieKey }) {
      latestState = useCookie(cookieKey);
      return null;
    }

    let renderer;
    act(() => { renderer = TestRenderer.create(React.createElement(TestComponent, { cookieKey: 'keyA' })); });
    assert.equal(latestState[0], 'valA');

    // Change the key!
    act(() => { renderer.update(React.createElement(TestComponent, { cookieKey: 'keyB' })); });
    
    assert.equal(latestState[0], 'valB');
  });

  await t.test('duplicate cookie names with different paths', () => {
    setGlobal('document', { cookie: "theme=dark; theme=light" }); 
    let values = [];

    function TestComponent() {
      const [val] = useCookie('theme');
      values.push(val);
      return null;
    }

    act(() => { TestRenderer.create(React.createElement(TestComponent)); });

    // Should return the first one found in document.cookie (standard browser behavior)
    assert.equal(values[values.length - 1], 'dark');
  });
});
