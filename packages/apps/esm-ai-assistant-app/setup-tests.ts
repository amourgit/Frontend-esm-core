import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type {} from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'));

window.getEgenSpaBase = vi.fn(() => '/egen/spa/');

afterEach(cleanup);

// happy-dom ≥ 20.8 implémente l'API Web Animations : framer-motion l'utilise alors et, à chaque démontage,
// `Animation.cancel()` rejette `finished` avec une AbortError non interceptée qui fait échouer vitest.
// Les versions précédentes n'avaient pas `Element.prototype.animate` (moteur JS de framer-motion).
Reflect.deleteProperty(Element.prototype, 'animate');
