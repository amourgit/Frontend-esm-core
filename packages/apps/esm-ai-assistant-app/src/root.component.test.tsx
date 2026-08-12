import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { setupTenantSystem } from '@egen-civitas/esm-tenant';
import Root from './root.component';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <>{children}</>,
  Route: ({ children, element, path }: any) => {
    const publicPaths = ['login/*', 'logout/*', 'change-password/*'];
    if (publicPaths.includes(path)) {
      return null;
    }
    return element ?? children;
  },
  Routes: ({ children }: any) => <>{children}</>,
}));

vi.mock('./components/assistant-widget/assistant-widget.component', () => ({
  default: () => <div data-testid="assistant-widget">Mock Assistant Widget</div>,
}));

afterEach(() => {
  cleanup();
  // Remet le système tenant en mode "off" entre les tests.
  setupTenantSystem({ mode: 'off' });
});

describe('Root', () => {
  it('renders the assistant widget unconditionally on authenticated routes (mode off)', () => {
    render(<Root />);
    expect(screen.getByTestId('assistant-widget')).toBeInTheDocument();
  });

  it('renders the assistant widget unconditionally when a tenant is captured (mode single)', () => {
    setupTenantSystem({ mode: 'single', defaultTenantId: 'mef-gabon' });
    render(<Root />);
    expect(screen.getByTestId('assistant-widget')).toBeInTheDocument();
  });
});
