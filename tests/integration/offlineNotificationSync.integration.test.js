const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal } = require('../setup');
const { useOnlineStatus, useNotifications, useBoolean } = hooks;

test('Integration: useOnlineStatus + useNotifications + useBoolean coordinates network reconnection and sync alerts', async () => {
  const windowListeners = {};
  const sentNotifications = [];

  setGlobal('navigator', { onLine: true });
  setGlobal('window', {
    addEventListener: (eventName, listener) => {
      windowListeners[eventName] = listener;
    },
    removeEventListener: (eventName) => {
      delete windowListeners[eventName];
    },
    Notification: {
      permission: 'granted',
      requestPermission: async () => 'granted',
    },
  });

  const NotificationMock = function (title, options) {
    this.title = title;
    this.options = options;
    sentNotifications.push({ title, options });
    return {
      addEventListener: () => {},
      close: () => {},
    };
  };
  NotificationMock.permission = 'granted';
  NotificationMock.requestPermission = async () => 'granted';
  setGlobal('Notification', NotificationMock);
  setGlobal('document', {
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  let coordinatorState;

  function NetworkSyncCoordinator() {
    const isOnline = useOnlineStatus();
    const { sendNotification } = useNotifications({ autoRequest: false });
    const { value: hasPendingChanges, setTrue: markDirty, setFalse: markClean } = useBoolean(false);
    const [syncedItems, setSyncedItems] = React.useState(0);

    const prevOnline = React.useRef(isOnline);

    // When connection restores and there are pending changes, flush sync
    React.useEffect(() => {
      if (prevOnline.current !== isOnline) {
        if (!isOnline) {
          sendNotification('Connection Lost', { body: 'Working offline' });
        }
        prevOnline.current = isOnline;
      }
      if (isOnline && hasPendingChanges) {
        setSyncedItems((count) => count + 1);
        markClean();
        sendNotification('Connection Restored', { body: 'Changes synchronized successfully' });
      }
    }, [isOnline, hasPendingChanges, sendNotification, markClean]);

    coordinatorState = {
      isOnline,
      hasPendingChanges,
      syncedItems,
      markDirty,
    };

    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(NetworkSyncCoordinator));
  });

  assert.equal(coordinatorState.isOnline, true);
  assert.equal(coordinatorState.hasPendingChanges, false);
  assert.equal(coordinatorState.syncedItems, 0);
  assert.equal(sentNotifications.length, 0);

  // Network drops offline
  act(() => {
    windowListeners.offline();
  });

  assert.equal(coordinatorState.isOnline, false);
  assert.equal(sentNotifications.length, 1);
  assert.equal(sentNotifications[0].title, 'Connection Lost');

  // User makes modifications while offline
  act(() => {
    coordinatorState.markDirty();
  });
  assert.equal(coordinatorState.hasPendingChanges, true);

  // Network reconnects
  act(() => {
    windowListeners.online();
  });

  assert.equal(coordinatorState.isOnline, true);
  assert.equal(coordinatorState.hasPendingChanges, false);
  assert.equal(coordinatorState.syncedItems, 1);
  assert.equal(sentNotifications.length, 2);
  assert.equal(sentNotifications[1].title, 'Connection Restored');
});
