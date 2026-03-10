import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe(element: Element): void {}
  unobserve(element: Element): void {}
  disconnect(): void {}
};
