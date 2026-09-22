const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const hooks = require('../..');
const { setGlobal, wait, createStorage } = require('../setup');
const { useDebounce, useLocalStorage, usePrevious } = hooks;

test('Integration: useDebounce + useLocalStorage + usePrevious creates an auto-saving form with dirty tracking', async () => {
  const fakeStorage = createStorage();
  setGlobal('localStorage', fakeStorage);
  setGlobal('window', {
    addEventListener: () => {},
    removeEventListener: () => {},
  });

  let formState;

  function AutoSavingEditor({ initialText = '' }) {
    const [savedContent, setSavedContent] = useLocalStorage('doc:content', initialText);
    const [draft, setDraft] = React.useState(savedContent);
    const debouncedDraft = useDebounce(draft, 100);
    const previousSaved = usePrevious(savedContent);

    // Auto-save effect: save to localStorage when debouncedDraft changes
    React.useEffect(() => {
      if (debouncedDraft !== savedContent) {
        setSavedContent(debouncedDraft);
      }
    }, [debouncedDraft, savedContent, setSavedContent]);

    const isDirty = draft !== savedContent;

    formState = {
      draft,
      setDraft,
      savedContent,
      previousSaved,
      isDirty,
    };

    return null;
  }

  act(() => {
    TestRenderer.create(React.createElement(AutoSavingEditor, { initialText: 'Initial text' }));
  });

  assert.equal(formState.savedContent, 'Initial text');
  assert.equal(formState.isDirty, false);

  // User types into the form
  act(() => {
    formState.setDraft('Updated draft text');
  });

  // Immediately dirty, but not yet saved in localStorage
  assert.equal(formState.isDirty, true);
  assert.equal(formState.savedContent, 'Initial text');

  // Wait for debounce delay (100ms)
  await act(async () => {
    await wait(150);
  });

  // Now debouncedDraft triggered setSavedContent!
  assert.equal(formState.savedContent, 'Updated draft text');
  assert.equal(formState.previousSaved, 'Initial text');
  assert.equal(formState.isDirty, false);
  assert.equal(fakeStorage.getItem('doc:content'), JSON.stringify('Updated draft text'));
});
