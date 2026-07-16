const { afterEach } = require('node:test');


const globalNames = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'IntersectionObserver',
  'ResizeObserver',
];

const originalGlobals = new Map(
  globalNames.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(global, name),
  ])
);

function setGlobal(name, value) {
  Object.defineProperty(global, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreGlobals() {
  for (const name of globalNames) {
    const descriptor = originalGlobals.get(name);

    if (descriptor) {
      Object.defineProperty(global, name, descriptor);
    } else {
      delete global[name];
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStorage(initial = {}) {
  const store = { ...initial };

  return {
    getItem: (key) =>
      Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    store,
  };
}

afterEach(() => {
  restoreGlobals();
});

module.exports = { setGlobal, restoreGlobals, wait, createStorage };
