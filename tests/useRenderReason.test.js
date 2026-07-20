const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { useRenderReason } = hooks;

test('useRenderReason tracks primitive changes', () => {
  let latestInfo = null;

  function TestComponent({ count }) {
    useRenderReason('TestComponent', { count }, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  const root = TestRenderer.create(React.createElement(TestComponent, { count: 1 }));
  assert.equal(latestInfo, null, 'Should not trigger on initial render');

  act(() => {
    root.update(React.createElement(TestComponent, { count: 2 }));
  });

  assert.ok(latestInfo, 'Should trigger on re-render');
  assert.equal(latestInfo.renderCount, 2);
  assert.equal(latestInfo.changes.length, 1);
  assert.equal(latestInfo.changes[0].key, 'count');
  assert.equal(latestInfo.changes[0].type, 'primitive-changed');
  assert.equal(latestInfo.changes[0].from, 1);
  assert.equal(latestInfo.changes[0].to, 2);
});

test('useRenderReason tracks reference-changed-value-same for objects', () => {
  let latestInfo = null;

  function TestComponent({ data }) {
    useRenderReason('TestComponent', { data }, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  const root = TestRenderer.create(React.createElement(TestComponent, { data: { a: 1 } }));

  act(() => {
    // New reference, exact same content
    root.update(React.createElement(TestComponent, { data: { a: 1 } }));
  });

  assert.equal(latestInfo.changes.length, 1);
  assert.equal(latestInfo.changes[0].type, 'reference-changed-value-same');
});

test('useRenderReason tracks reference-changed-value-changed for objects', () => {
  let latestInfo = null;

  function TestComponent({ data }) {
    useRenderReason('TestComponent', { data }, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  const root = TestRenderer.create(React.createElement(TestComponent, { data: { a: 1 } }));

  act(() => {
    // New reference, new content
    root.update(React.createElement(TestComponent, { data: { a: 2 } }));
  });

  assert.equal(latestInfo.changes.length, 1);
  assert.equal(latestInfo.changes[0].type, 'reference-changed-value-changed');
});

test('useRenderReason tracks function-reference-changed', () => {
  let latestInfo = null;

  function TestComponent({ onAction }) {
    useRenderReason('TestComponent', { onAction }, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  const root = TestRenderer.create(React.createElement(TestComponent, { onAction: () => {} }));

  act(() => {
    // New inline function
    root.update(React.createElement(TestComponent, { onAction: () => {} }));
  });

  assert.equal(latestInfo.changes.length, 1);
  assert.equal(latestInfo.changes[0].type, 'function-reference-changed');
});

test('useRenderReason detects wasted renders', () => {
  let latestInfo = null;

  function TestComponent({ id }) {
    // We only track `id`
    useRenderReason('TestComponent', { id }, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  function Parent() {
    const [renderToggle, setRenderToggle] = React.useState(false);
    return React.createElement('div', null,
      React.createElement(TestComponent, { id: 1 }),
      React.createElement('button', { onClick: () => setRenderToggle(!renderToggle) }, 'Update')
    );
  }

  const root = TestRenderer.create(React.createElement(Parent));

  act(() => {
    // Update parent state, which forces TestComponent to re-render,
    // but the `id` prop passed to TestComponent is still exactly 1.
    root.root.findByType('button').props.onClick();
  });

  assert.ok(latestInfo.isWastedRender, 'Should be flagged as a wasted render');
  assert.equal(latestInfo.changes.length, 0, 'Should have 0 changes');
});

test('useRenderReason detects suspiciously frequent renders', () => {
  let latestInfo = null;

  function TestComponent({ count }) {
    useRenderReason('TestComponent', { count }, {
      logToConsole: false,
      warnThreshold: 3, // very low for testing
      warnWindowMs: 1000,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  const root = TestRenderer.create(React.createElement(TestComponent, { count: 0 }));

  // Render 1 was mount.
  // Render 2, 3, 4, 5 (4 renders + 1 mount = 5 renders, threshold is 3)
  for (let i = 1; i <= 4; i++) {
    act(() => {
      root.update(React.createElement(TestComponent, { count: i }));
    });
  }

  assert.ok(latestInfo.isSuspiciouslyFrequent, 'Should be flagged as suspiciously frequent');
});

test('useRenderReason tracks context primitive changes', () => {
  let latestInfo = null;
  const MyContext = React.createContext('default');
  MyContext.displayName = 'MyContext';

  function TestComponent() {
    React.useContext(MyContext);
    useRenderReason('TestComponent', {}, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  function App({ val }) {
    return React.createElement(MyContext.Provider, { value: val }, React.createElement(TestComponent));
  }

  const root = TestRenderer.create(React.createElement(App, { val: 'initial' }));

  act(() => {
    root.update(React.createElement(App, { val: 'changed' }));
  });

  assert.ok(latestInfo, 'Should trigger on re-render');
  assert.equal(latestInfo.changes.length, 1);
  assert.equal(latestInfo.changes[0].key, 'Context(MyContext)');
  assert.equal(latestInfo.changes[0].type, 'primitive-changed');
  assert.equal(latestInfo.changes[0].from, 'initial');
  assert.equal(latestInfo.changes[0].to, 'changed');
});

test('useRenderReason tracks context reference-changed-value-same', () => {
  let latestInfo = null;
  const MyContext = React.createContext({ theme: 'light' });
  MyContext.displayName = 'ThemeContext';

  function TestComponent() {
    React.useContext(MyContext);
    useRenderReason('TestComponent', {}, {
      logToConsole: false,
      onRender: (info) => {
        latestInfo = info;
      }
    });
    return null;
  }

  function App({ obj }) {
    return React.createElement(MyContext.Provider, { value: obj }, React.createElement(TestComponent));
  }

  // Create two distinct objects with the same content
  const obj1 = { theme: 'dark' };
  const obj2 = { theme: 'dark' };

  const root = TestRenderer.create(React.createElement(App, { obj: obj1 }));

  act(() => {
    root.update(React.createElement(App, { obj: obj2 }));
  });

  assert.ok(latestInfo, 'Should trigger on re-render');
  assert.equal(latestInfo.changes.length, 1);
  assert.equal(latestInfo.changes[0].key, 'Context(ThemeContext)');
  assert.equal(latestInfo.changes[0].type, 'reference-changed-value-same');
  assert.deepEqual(latestInfo.changes[0].from, obj1);
  assert.deepEqual(latestInfo.changes[0].to, obj2);
});
