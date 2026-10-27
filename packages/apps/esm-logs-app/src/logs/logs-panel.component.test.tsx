import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LogsPanel from './logs-panel.component';
import { pushLog, resetLogStoreForTests } from './log-store';

vi.mock('@egen-civitas/esm-framework', () => ({}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, options?: Record<string, unknown>) =>
      fallback.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(options?.[name] ?? '')),
  }),
}));

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 40)));
const rows = () => within(screen.getByTestId('logs-list')).queryAllByRole('listitem');

describe('LogsPanel', () => {
  beforeEach(() => {
    resetLogStoreForTests();
  });

  it('attend les logs quand le tampon est vide', () => {
    render(<LogsPanel />);
    expect(screen.getByText('En attente de logs…')).toBeInTheDocument();
    expect(screen.getByText(/Console du navigateur uniquement/)).toBeInTheDocument();
  });

  it('affiche les lignes en temps réel avec leur niveau et conserve les couleurs ANSI', async () => {
    render(<LogsPanel />);
    act(() => {
      pushLog('error', '\u001b[31mErreur critique\u001b[0m', 'esm-home-app');
      pushLog('success', 'Compilé', 'esm-home-app');
    });
    await settle();
    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveAttribute('data-level', 'error');
    expect(rows()[1]).toHaveAttribute('data-level', 'success');
    expect(screen.getByText('Erreur critique')).toHaveStyle({ color: '#f87171' });
    expect(screen.getByText('2 / 2 lignes')).toBeInTheDocument();
  });

  it('filtre par niveau, par recherche et par source', async () => {
    render(<LogsPanel />);
    act(() => {
      pushLog('error', 'disque plein', 'a');
      pushLog('warn', 'lent', 'a');
      pushLog('info', 'démarrage', 'b');
    });
    await settle();

    fireEvent.click(screen.getByRole('button', { name: /Erreurs/ }));
    expect(rows().map((r) => r.getAttribute('data-level'))).toEqual(['warn', 'info']);
    fireEvent.click(screen.getByRole('button', { name: /Erreurs/ }));

    fireEvent.change(screen.getByLabelText('Rechercher dans les logs'), { target: { value: 'DISQUE' } });
    await settle();
    expect(rows()).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Rechercher dans les logs'), { target: { value: '' } });

    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'b' } });
    await settle();
    expect(rows()).toHaveLength(1);
    expect(screen.getByText('démarrage')).toBeInTheDocument();
  });

  it('met en pause sans perdre les lignes puis reprend', async () => {
    render(<LogsPanel />);
    act(() => pushLog('info', 'avant'));
    await settle();
    fireEvent.click(screen.getByTitle('Pause'));
    act(() => pushLog('info', 'pendant'));
    await settle();
    expect(rows()).toHaveLength(1);
    expect(screen.getByText('En pause — 1 en attente')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Reprendre'));
    await settle();
    expect(rows()).toHaveLength(2);
  });

  it('efface les logs', async () => {
    render(<LogsPanel />);
    act(() => pushLog('info', 'x'));
    await settle();
    fireEvent.click(screen.getByTitle('Effacer'));
    await settle();
    expect(rows()).toHaveLength(0);
    expect(screen.getByText('En attente de logs…')).toBeInTheDocument();
  });

  it('fixe sa hauteur sur celle de la zone moins son en-tête (seule la liste défile)', () => {
    const client = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    const offset = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40);
    render(
      <aside data-anchor="bottom">
        <header />
        <div>
          <LogsPanel />
        </div>
      </aside>,
    );
    expect(screen.getByRole('region', { name: 'Logs système' })).toHaveStyle({ height: '260px' });
    client.mockRestore();
    offset.mockRestore();
  });
});
