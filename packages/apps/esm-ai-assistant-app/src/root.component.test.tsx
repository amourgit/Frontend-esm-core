import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { setupTenantSystem } from '@egen/esm-tenant';
import Root from './root.component';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <>{children}</>,
  Route: ({ children, element, path }: any) => {
    const publicPaths = ['login/*', 'logout/*', 'home/*', 'change-password/*', 'tenant-suspended/*'];
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

afterEach(async () => {
  cleanup();
  // Remet le système tenant en mode "off" entre les tests (pas de reset
  // exposé publiquement par @egen/esm-tenant en dehors de ses propres
  // tests — setupTenantSystem({mode:'off'}) est le seul moyen propre
  // depuis un package consommateur).
  await setupTenantSystem({ mode: 'off' });
});

describe('Root', () => {
  it('renders the assistant widget on authenticated routes when no tenant restricts it', () => {
    render(<Root />);
    expect(screen.getByTestId('assistant-widget')).toBeInTheDocument();
  });

  it('hides the widget when the active tenant explicitly disables the "ai-assistant" feature flag', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [
        { id: 'lycee-lb', name: 'Lycée LB', featureFlags: { 'ai-assistant': false } },
      ],
      defaultTenantId: 'lycee-lb',
      applyTheme: false,
    });

    render(<Root />);
    await waitFor(() => {
      expect(screen.queryByTestId('assistant-widget')).not.toBeInTheDocument();
    });
  });

  it('keeps the widget visible when the active tenant does not declare the flag at all', async () => {
    await setupTenantSystem({
      mode: 'single',
      staticTenants: [{ id: 'mef-gabon', name: 'MEF Gabon' }],
      defaultTenantId: 'mef-gabon',
      applyTheme: false,
    });

    render(<Root />);
    await waitFor(() => {
      expect(screen.getByTestId('assistant-widget')).toBeInTheDocument();
    });
  });
});
