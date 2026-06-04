import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

declare global {
  interface Window {
    egenBase: string;
    spaBase: string;
    getEgenSpaBase: () => string;
  }
}

const { getComputedStyle } = window;
window.getComputedStyle = (element) => getComputedStyle(element);
window.egenBase = '/egen';
window.spaBase = '/spa';
window.getEgenSpaBase = () => '/egen/spa/';
window.HTMLElement.prototype.scrollIntoView = vi.fn();
