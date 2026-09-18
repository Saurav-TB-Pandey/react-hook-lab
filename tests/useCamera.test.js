const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('..');
const { setGlobal } = require('./setup');
const { useCamera } = hooks;

test('useCamera initializes correctly', () => {
  let latestState;
  
  function TestComponent() {
    latestState = useCamera();
    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });

  assert.equal(latestState.status, 'idle');
  assert.equal(latestState.isRecording, false);
});

test('useCamera stops tracks if unmounted while requesting camera', async () => {
  let latestState;
  let trackStopped = false;
  const mockTrack = {
    stop: () => {
      trackStopped = true;
    },
  };
  const mockStream = {
    getTracks: () => [mockTrack],
  };

  let resolveGetUserMedia;
  const getUserMediaPromise = new Promise((resolve) => {
    resolveGetUserMedia = resolve;
  });

  setGlobal('navigator', {
    mediaDevices: {
      getUserMedia: () => getUserMediaPromise,
    },
  });

  function TestComponent() {
    latestState = useCamera();
    return null;
  }

  let renderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(TestComponent));
  });

  // Start requesting camera
  let requestPromise;
  act(() => {
    requestPromise = latestState.requestCamera();
  });

  // Unmount component while request is in-flight
  act(() => {
    renderer.unmount();
  });

  // Now resolve getUserMedia
  await act(async () => {
    resolveGetUserMedia(mockStream);
    await requestPromise;
  });

  // Track must have been stopped to avoid hardware leak
  assert.equal(trackStopped, true);
});
