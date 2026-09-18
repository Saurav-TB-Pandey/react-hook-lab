const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal, wait } = require('../setup');
const { useClickOutside, useBoolean, useClipboard } = hooks;

test('Integration: useClickOutside + useBoolean + useClipboard coordinates interactive modal copying and dismissal', async () => {
  let copiedText = '';
  setGlobal('navigator', {
    clipboard: {
      writeText: async (text) => {
        copiedText = text;
      },
    },
  });

  const docListeners = {};
  setGlobal('document', {
    addEventListener: (event, cb) => {
      docListeners[event] = cb;
    },
    removeEventListener: (event) => {
      delete docListeners[event];
    },
  });

  let latestModalState;

  function ShareModal() {
    const isOpen = useBoolean(true);
    const clipboard = useClipboard(100);
    const modalRef = React.useRef({
      contains: (target) => target === 'inside_modal',
    });

    useClickOutside(modalRef, () => {
      isOpen.setFalse();
    });

    latestModalState = {
      isOpen: isOpen.value,
      open: isOpen.setTrue,
      close: isOpen.setFalse,
      clipboard,
    };

    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(ShareModal));
  });

  assert.equal(latestModalState.isOpen, true);
  assert.equal(latestModalState.clipboard.copied, false);

  // 1. User clicks "Copy" inside the modal
  await act(async () => {
    await latestModalState.clipboard.copy('https://example.com/share');
  });

  assert.equal(copiedText, 'https://example.com/share');
  assert.equal(latestModalState.clipboard.copied, true);

  // 2. Click inside modal does NOT close it
  act(() => {
    docListeners.mousedown?.({ target: 'inside_modal' });
  });

  assert.equal(latestModalState.isOpen, true);

  // 3. Click outside modal closes it
  act(() => {
    docListeners.mousedown?.({ target: 'outside_screen' });
  });

  assert.equal(latestModalState.isOpen, false);

  // 4. Copied state safely resets after timeout without crashing
  await act(async () => {
    await wait(150);
  });

  assert.equal(latestModalState.clipboard.copied, false);
});
