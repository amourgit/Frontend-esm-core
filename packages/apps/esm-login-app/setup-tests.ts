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

// happy-dom ≥ 20.8 implémente l'API Web Animations : framer-motion l'utilise alors et, à chaque démontage,
// `Animation.cancel()` rejette `finished` avec une AbortError non interceptée qui fait échouer vitest.
// Les versions précédentes n'avaient pas `Element.prototype.animate` (moteur JS de framer-motion).
Reflect.deleteProperty(Element.prototype, 'animate');
