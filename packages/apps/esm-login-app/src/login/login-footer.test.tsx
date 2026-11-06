import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useConfig } from '@egen-civitas/esm-framework';
import { civitasWebsite } from '../brand';
import { LoginFooter } from './login-footer.component';

const mockUseConfig = vi.mocked(useConfig);

describe('LoginFooter', () => {
  beforeEach(() => {
    mockUseConfig.mockReturnValue({ footer: { additionalLogos: [] } });
  });

  it("crédite CIVITAS (l'éditeur) avec un lien vers son site, ouvert dans un nouvel onglet", () => {
    render(<LoginFooter />);

    const link = screen.getByRole('link', { name: /CIVITAS/i });
    expect(link).toHaveAttribute('href', 'https://civitas-africa.vercel.app/');
    expect(link).toHaveAttribute('href', civitasWebsite);
    expect(link).toHaveAttribute('target', '_blank');
    // noopener : la page ouverte n'a pas accès à window.opener ; noreferrer : pas de fuite du Referer.
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('affiche le logo CIVITAS complet, tel que fourni, dans le lien (sans pastille)', () => {
    render(<LoginFooter />);

    const logo = screen.getByRole('img', { name: /logo CIVITAS|CIVITAS logo/i });
    expect(logo).toHaveAttribute('src', expect.stringMatching(/civitas-logo-full/));
    const link = screen.getByRole('link', { name: /CIVITAS/i });
    expect(link).toContainElement(logo);
    expect(link.className).not.toMatch(/bg-/);
    // Taille adaptée à l'espace disponible du pied de page (suit la hauteur de la fenêtre, bornée).
    expect(logo.className).toMatch(/h-\[clamp\(3\.5rem,9vh,6rem\)\]/);
  });

  it("ne montre plus le logo EGEN dans le pied de page (EGEN est le produit, pas l'éditeur)", () => {
    render(<LoginFooter />);

    expect(screen.queryByRole('img', { name: /egen/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /egen/i })).not.toBeInTheDocument();
  });

  it('garde les logos additionnels configurés (`footer.additionalLogos`)', () => {
    mockUseConfig.mockReturnValue({
      footer: { additionalLogos: [{ src: 'https://example.org/partner.png', alt: 'Partner' }] },
    });
    render(<LoginFooter />);

    expect(screen.getByRole('img', { name: 'Partner' })).toHaveAttribute('src', 'https://example.org/partner.png');
    expect(screen.getByRole('link', { name: /CIVITAS/i })).toBeInTheDocument();
  });

  it("fonctionne sans configuration de pied de page", () => {
    mockUseConfig.mockReturnValue({});
    render(<LoginFooter />);

    expect(screen.getByRole('link', { name: /CIVITAS/i })).toBeInTheDocument();
  });
});
