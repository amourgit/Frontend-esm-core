import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

window.egenBase = '/egen';
window.spaBase = '/spa';
window.getEgenSpaBase = vi.fn(() => '/egen/spa/');

afterEach(cleanup);
