import { vi } from 'vitest';

// Environnement navigateur minimal pour happy-dom (matchMedia / ResizeObserver absents).
export function installBrowserStubs() {
  if (!window.matchMedia) {
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  if (!(window as any).ResizeObserver) {
    (window as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  (window as any).getEgenSpaBase = () => '/';
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
}
