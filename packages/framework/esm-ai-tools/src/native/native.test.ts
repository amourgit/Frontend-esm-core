import { describe, it, expect, vi } from 'vitest';
import { navigateTool } from './index';

const mockNavigate = vi.fn();

vi.mock('@egen/esm-navigation', () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
}));

vi.mock('@egen/esm-styleguide/src/public', () => ({
  showNotification: vi.fn(),
  showSnackbar: vi.fn(),
  showModal: vi.fn(),
}));

vi.mock('@egen/esm-api', () => ({
  egenFetch: vi.fn(),
}));

describe('navigateTool', () => {
  it('préfixe une route logique avec ${egenSpaBase} pour déclencher une vraie navigation SPA', async () => {
    mockNavigate.mockClear();

    await navigateTool.execute({ args: { route: '/login' } } as any);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '${egenSpaBase}/login' });
  });

  it('ne double pas le préfixe si le LLM le fournit déjà', async () => {
    mockNavigate.mockClear();

    await navigateTool.execute({ args: { route: '${egenSpaBase}/home' } } as any);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '${egenSpaBase}/home' });
  });

  it('laisse une URL absolue inchangée', async () => {
    mockNavigate.mockClear();

    await navigateTool.execute({ args: { route: 'https://example.com/page' } } as any);

    expect(mockNavigate).toHaveBeenCalledWith({ to: 'https://example.com/page' });
  });
});
