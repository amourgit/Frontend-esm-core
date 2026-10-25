import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type {} from '@egen-civitas/esm-framework';

vi.mock('@egen-civitas/esm-framework', () => import('@egen-civitas/esm-framework/mock'));

window.getEgenSpaBase = vi.fn(() => '/egen/spa/');

afterEach(cleanup);
