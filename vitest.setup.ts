import "@testing-library/jest-dom";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe(element: Element): void {}
  unobserve(element: Element): void {}
  disconnect(): void {}
};

// Ensure `localStorage` is available on the global object (some tests call `localStorage.clear()`)
// Prefer the jsdom `window.localStorage` when present, otherwise provide a simple
// in-memory polyfill that implements the Storage API used by tests.
const ensureLocalStorage = () => {
  if (typeof window !== "undefined" && (window as any).localStorage) {
    (globalThis as any).localStorage = (window as any).localStorage;
    return;
  }

  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
};

ensureLocalStorage();

// If some environment provided a `localStorage` but it's missing `clear()`, override it.
if (typeof (globalThis as any).localStorage?.clear !== "function") {
  // Some dependencies (bundled ESM in node_modules) import named exports from the
  // CommonJS `cookie` package which can cause ESM resolution errors in the
  // Vitest environment. Provide a lightweight mock with `parse` and `serialize`
  // to ensure tests that transitively import `cookie` work correctly.
  import { vi } from "vitest";

  vi.mock("cookie", () => ({
    parse: (cookieHeader: string) => {
      if (!cookieHeader) return {};
      return cookieHeader
        .split(";")
        .reduce<Record<string, string>>((acc, part) => {
          const [rawName, ...rest] = part.split("=");
          if (!rawName) return acc;
          const name = decodeURIComponent(rawName.trim());
          const value = rest.join("=").trim();
          acc[name] = decodeURIComponent(value);
          return acc;
        }, {});
    },
    serialize: (name: string, val: string) =>
      `${encodeURIComponent(name)}=${encodeURIComponent(val)}`,
  }));
  const existing = (globalThis as any).localStorage || {};
  const store: Record<string, string> = {};
  try {
    // Try to copy existing keys
    for (const k of Object.keys(existing)) {
      // skip functions
      if (typeof (existing as any)[k] !== "function")
        store[k] = (existing as any)[k];
    }
  } catch (e) {}
  (globalThis as any).localStorage = {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}
