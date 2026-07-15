/**
 * Creates a random id for the current browser tab.
 */
export function createTabId(): string {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    try {
      return cryptoApi.randomUUID();
    } catch {
      return createMathRandomId();
    }
  }

  const random = new Uint32Array(4);

  if (cryptoApi) {
    try {
      cryptoApi.getRandomValues(random);
    } catch {
      return createMathRandomId();
    }
  } else {
    fillWithMathRandom(random);
  }

  return Array.from(random, (value) => value.toString(16).padStart(8, "0")).join("-");
}

function createMathRandomId(): string {
  const random = new Uint32Array(4);
  fillWithMathRandom(random);
  return Array.from(random, (value) => value.toString(16).padStart(8, "0")).join("-");
}

function fillWithMathRandom(values: Uint32Array): void {
  for (let index = 0; index < values.length; index += 1) {
    values[index] = Math.floor(Math.random() * 0xffffffff);
  }
}
