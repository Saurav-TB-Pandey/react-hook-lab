const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal } = require('../setup');
const { useElementSize, useToggle, useDeepMemo } = hooks;

test('Integration: useElementSize + useToggle + useDeepMemo coordinates responsive layout adapting to container resize', () => {
  let observerCallback;
  const fakeElement = {};

  class MockResizeObserver {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  }

  setGlobal('window', { ResizeObserver: MockResizeObserver });
  setGlobal('ResizeObserver', MockResizeObserver);

  let layoutState;
  let memoCalculationCount = 0;

  function ResponsiveDashboard({ initialWidth = 1024, initialHeight = 768 }) {
    const containerRef = React.useRef(fakeElement);
    const containerSize = useElementSize(containerRef);
    const isMobile = containerSize.width < 768;

    const {
      value: sidebarState,
      setValue: setSidebarState,
      toggle: toggleSidebar,
    } = useToggle(isMobile ? 'collapsed' : 'expanded', isMobile ? 'expanded' : 'collapsed');

    // Complex navigation layout options memoized deeply based on layout parameters
    const layoutConfig = useDeepMemo(() => {
      memoCalculationCount++;
      return {
        columns: isMobile ? 1 : 3,
        sidebar: sidebarState,
        dimensions: {
          w: containerSize.width,
          h: containerSize.height,
        },
      };
    }, [isMobile, sidebarState, containerSize.width, containerSize.height]);

    layoutState = {
      containerSize,
      isMobile,
      sidebarState,
      setSidebarState,
      toggleSidebar,
      layoutConfig,
    };

    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(ResponsiveDashboard));
  });

  // Default initial size (0, 0) before observer fires
  assert.equal(layoutState.isMobile, true);
  assert.equal(memoCalculationCount, 1);

  // Resize container to Desktop size (1200 x 800)
  act(() => {
    observerCallback([
      {
        contentRect: {
          width: 1200,
          height: 800,
        },
      },
    ]);
  });

  assert.equal(layoutState.containerSize.width, 1200);
  assert.equal(layoutState.isMobile, false);
  assert.equal(layoutState.layoutConfig.columns, 3);
  assert.equal(memoCalculationCount, 2);

  // Toggle sidebar
  act(() => {
    layoutState.toggleSidebar();
  });

  assert.equal(memoCalculationCount, 3);

  // Resize to Mobile screen (< 768px)
  act(() => {
    observerCallback([
      {
        contentRect: {
          width: 480,
          height: 800,
        },
      },
    ]);
  });

  assert.equal(layoutState.containerSize.width, 480);
  assert.equal(layoutState.isMobile, true);
  assert.equal(layoutState.layoutConfig.columns, 1);
  assert.equal(memoCalculationCount, 4);
});
