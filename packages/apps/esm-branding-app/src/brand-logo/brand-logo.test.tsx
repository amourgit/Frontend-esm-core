import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { navigate, useConfig } from '@egen-civitas/esm-framework';
import { configSchema, type ConfigSchema } from '../config-schema';
import BrandLogo from './brand-logo.component';

const mockUseConfig = vi.mocked(useConfig);

/** Config par défaut du schéma (ce que l'app reçoit tant que l'entreprise ne renseigne rien), avec surcharges. */
function config(
  overrides: Partial<{ organization: Partial<ConfigSchema['organization']>; logo: Partial<ConfigSchema['logo']> }> = {},
) {
  const defaults = (group: Record<string, { _default: unknown }>) =>
    Object.fromEntries(Object.entries(group).map(([key, value]) => [key, value._default]));
  return {
    organization: { ...defaults(configSchema.organization), ...overrides.organization },
    logo: { ...defaults(configSchema.logo), ...overrides.logo },
  } as ConfigSchema;
}

describe('BrandLogo', () => {
  beforeEach(() => {
    // `interpolateUrl` (réel) lit la base SPA du shell.
    Object.assign(window, { getEgenBase: () => '/', getEgenSpaBase: () => '/spa/' });
    mockUseConfig.mockReturnValue(config());
  });

  it("affiche par défaut le logo EGEN fourni, avec le nom et la description de l'organisation", () => {
    render(<BrandLogo />);

    const logo = screen.getByRole('img', { name: 'EGEN — Écosystème Gouvernemental de l’Économie Numérique' });
    expect(logo).toHaveAttribute('src', expect.stringMatching(/egen-logo-full/));
  });

  it("affiche le logo et l'identité renseignés par l'entreprise", () => {
    mockUseConfig.mockReturnValue(
      config({
        organization: { name: 'Acme', description: 'Gouvernance' },
        logo: { src: 'https://cdn.example.org/acme.svg' },
      }),
    );
    render(<BrandLogo />);

    expect(screen.getByRole('img', { name: 'Acme — Gouvernance' })).toHaveAttribute(
      'src',
      'https://cdn.example.org/acme.svg',
    );
    expect(screen.getByRole('link', { name: 'Acme — Gouvernance' })).toHaveAttribute('title', 'Acme — Gouvernance');
  });

  it('un texte alternatif explicite remplace celui construit depuis le nom', () => {
    mockUseConfig.mockReturnValue(config({ logo: { alt: 'Logo Acme' } }));
    render(<BrandLogo />);

    expect(screen.getByRole('img', { name: 'Logo Acme' })).toBeInTheDocument();
  });

  it('sans description, le nom seul sert de libellé', () => {
    mockUseConfig.mockReturnValue(config({ organization: { name: 'Acme', description: '' } }));
    render(<BrandLogo />);

    expect(screen.getByRole('img', { name: 'Acme' })).toBeInTheDocument();
  });

  it('se met à jour à chaud quand la configuration change, sans rien remonter', () => {
    const { rerender } = render(<BrandLogo />);
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringMatching(/egen-logo-full/));

    mockUseConfig.mockReturnValue(config({ logo: { src: '/assets/nouveau-logo.png' } }));
    rerender(<BrandLogo />);

    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/nouveau-logo.png');
  });

  it('applique les hauteurs configurées (écran large et compact)', () => {
    mockUseConfig.mockReturnValue(config({ logo: { height: 60, compactHeight: 28 } }));
    render(<BrandLogo />);

    expect(screen.getByRole('img')).toHaveStyle({ '--logo-height': '60px', '--logo-compact-height': '28px' });
  });

  describe('lien', () => {
    it("mène par défaut à l'accueil, sans recharger la page", () => {
      render(<BrandLogo />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/spa/home');
      fireEvent.click(link);
      expect(navigate).toHaveBeenCalledWith({ to: '/spa/home' });
    });

    it('laisse le navigateur gérer un clic modifié (nouvel onglet)', () => {
      render(<BrandLogo />);

      fireEvent.click(screen.getByRole('link'), { ctrlKey: true });
      expect(navigate).not.toHaveBeenCalled();
    });

    it('laisse le navigateur gérer une destination externe', () => {
      mockUseConfig.mockReturnValue(config({ logo: { link: 'https://civitas-africa.vercel.app/' } }));
      render(<BrandLogo />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://civitas-africa.vercel.app/');
      fireEvent.click(link);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('sans destination, le logo n’est pas cliquable', () => {
      mockUseConfig.mockReturnValue(config({ logo: { link: '' } }));
      render(<BrandLogo />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});

describe('routes.json', () => {
  it('attache le logo au slot neutre de la TopBar et déclare son niveau et son emplacement, comme extension globale', async () => {
    const routes = (await import('../routes.json')).default as { extensions: Array<Record<string, unknown>> };
    expect(routes.extensions).toEqual([
      expect.objectContaining({
        name: 'brand-logo',
        slot: 'topbar-slot',
        component: 'brandLogo',
        meta: { global: true, topbar: { level: 'main', rank: 10, region: 'left', order: 0 } },
      }),
    ]);
  });
});
