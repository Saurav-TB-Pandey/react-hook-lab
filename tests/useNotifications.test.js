const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useNotifications } = hooks;

test('useNotifications requests permission and sends a notification', async () => {
  let latestState;
  let listeners = {};
  
  const mockNotificationInstance = {
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
    close: () => {}
  };

  const NotificationMock = function(title, options) {
    this.title = title;
    this.options = options;
    return Object.assign(this, mockNotificationInstance);
  };
  NotificationMock.permission = 'default';
  NotificationMock.requestPermission = async () => {
    NotificationMock.permission = 'granted';
    return 'granted';
  };

  setGlobal('window', { Notification: NotificationMock, addEventListener: () => {}, removeEventListener: () => {} });
  setGlobal('Notification', NotificationMock);
  setGlobal('document', { addEventListener: () => {}, removeEventListener: () => {} });

  function TestComponent() {
    latestState = useNotifications({ autoRequest: false });
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.permission, 'default');
  
  await act(async () => {
    await latestState.requestPermission();
  });
  
  assert.equal(latestState.permission, 'granted');
  
  let notif;
  act(() => {
    notif = latestState.sendNotification('Alert', { body: 'Test Notification' });
  });
  
  assert.equal(notif.title, 'Alert');
  assert.equal(notif.options.body, 'Test Notification');
  assert.equal(latestState.error, null);
});

test('useNotifications sets error if permission is denied', async () => {
  let latestState;
  
  const NotificationMock = function() {};
  NotificationMock.permission = 'default';
  NotificationMock.requestPermission = async () => {
    NotificationMock.permission = 'denied';
    return 'denied';
  };

  setGlobal('window', { Notification: NotificationMock, addEventListener: () => {}, removeEventListener: () => {} });
  setGlobal('Notification', NotificationMock);
  setGlobal('document', { addEventListener: () => {}, removeEventListener: () => {} });

  function TestComponent() {
    latestState = useNotifications({ autoRequest: false });
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  await act(async () => {
    await latestState.requestPermission();
  });
  
  assert.equal(latestState.permission, 'denied');
  assert.equal(latestState.error.includes('denied'), true);
});
