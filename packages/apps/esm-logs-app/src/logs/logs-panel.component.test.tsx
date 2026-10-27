import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LogsPanel from './logs-panel.component';
import { pushLog, resetLogStoreForTests } from './log-store';

// Le vrai ToolWindowHeader (framework) déplace ses enfants dans l'en-tête de la zone ; ici, un repère suffit.
vi.mock('@egen-civitas/esm-framework', () => ({
  ToolWindowHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="zone-header-slot">{children}</div>
  ),
}));
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

  it("place la barre d'outils dans l'en-tête de la zone, pas dans le contenu", () => {
    render(<LogsPanel />);
    const header = within(screen.getByTestId('zone-header-slot'));
    for (const name of [
      'Pause',
      'Suivre les nouveaux logs',
      'Retour à la ligne',
      'Copier',
      'Télécharger (.log)',
      'Effacer',
    ]) {
      expect(header.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(header.getByLabelText('Rechercher dans les logs')).toBeInTheDocument();
    expect(header.getByLabelText('Source')).toBeInTheDocument();
    expect(header.queryByTestId('logs-list')).not.toBeInTheDocument();
  });

  it("désactive copier, télécharger et effacer tant qu'il n'y a rien", async () => {
    render(<LogsPanel />);
    for (const name of ['Copier', 'Télécharger (.log)', 'Effacer'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
    act(() => pushLog('info', 'x'));
    await settle();
    for (const name of ['Copier', 'Télécharger (.log)', 'Effacer'])
      expect(screen.getByRole('button', { name })).toBeEnabled();
  });

  it('copie les lignes filtrées sans couleurs et confirme', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<LogsPanel />);
    act(() => {
      pushLog('error', '\u001b[31mErreur\u001b[0m', 'a');
      pushLog('info', 'ok', 'a');
    });
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /Avertissements/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));
    expect(await screen.findByRole('button', { name: 'Copié' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\[a\] ERROR Erreur\n.*\[a\] INFO ok$/);
  });

  it('copie via le repli execCommand quand le presse-papiers est indisponible', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const exec = vi.fn().mockReturnValue(true);
    Object.assign(document, { execCommand: exec });
    render(<LogsPanel />);
    act(() => pushLog('info', 'x'));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));
    expect(await screen.findByRole('button', { name: 'Copié' })).toBeInTheDocument();
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('télécharge un fichier .log des lignes affichées', async () => {
    const create = vi.fn(() => 'blob:logs');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<LogsPanel />);
    act(() => pushLog('warn', 'lent'));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger (.log)' }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { hidden: true })).not.toBeInTheDocument(); // lien retiré après le clic
    click.mockRestore();
  });

  it('bascule le retour à la ligne et le suivi', () => {
    render(<LogsPanel />);
    const list = screen.getByTestId('logs-list');
    expect(list).toHaveAttribute('data-wrap', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Retour à la ligne' }));
    expect(list).toHaveAttribute('data-wrap', 'false');

    const follow = screen.getByRole('button', { name: 'Suivre les nouveaux logs' });
    expect(follow).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(follow);
    expect(follow).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(follow);
    expect(follow).toHaveAttribute('aria-pressed', 'true');
  });

  it("ne plante pas si le shell fournit un framework sans ToolWindowHeader (barre d'outils en tête du panneau)", async () => {
    vi.resetModules();
    vi.doMock('@egen-civitas/esm-framework', () => ({ ToolWindowHeader: undefined }));
    const { default: Panel } = await import('./logs-panel.component');
    render(<Panel />);
    const region = screen.getByRole('region', { name: 'Logs système' });
    expect(within(region).getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(within(region).getByTestId('logs-list')).toBeInTheDocument();
    vi.doUnmock('@egen-civitas/esm-framework');
  });
});
