import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('./assistant-experience/AssistantExperience', () => ({
  default: () => <div data-testid="assistant-experience">Mock Assistant Experience</div>,
}));

afterEach(() => {
  // Remet le système tenant en mode "off" entre les tests.
  setupTenantSystem({ mode: 'off' });
});

describe('Root', () => {
  it('renders the assistant experience unconditionally on authenticated routes (mode off)', async () => {
    render(<Root />);
    expect(await screen.findByTestId('assistant-experience')).toBeInTheDocument();
  });

  it('renders the assistant experience unconditionally when a tenant is captured (mode single)', async () => {
    setupTenantSystem({ mode: 'single', defaultTenantId: 'mef-gabon' });
    render(<Root />);
    expect(await screen.findByTestId('assistant-experience')).toBeInTheDocument();
  });
});
