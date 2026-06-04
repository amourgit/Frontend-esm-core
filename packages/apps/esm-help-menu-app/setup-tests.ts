import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type {} from '@egen/esm-framework';

vi.mock('@egen/esm-framework', () => import('@egen/esm-framework/mock'));

afterEach(cleanup);
