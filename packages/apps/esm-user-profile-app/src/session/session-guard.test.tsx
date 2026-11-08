import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useConfig, useSession } from '@egen-civitas/esm-framework';
import { useTenantMode } from '@egen-civitas/esm-tenant';
import SessionGuard from './session-guard.component';

vi.mock('@egen-civitas/esm-tenant', () => ({ useTenantMode: vi.fn() }));

const mockUseSession = vi.mocked(useSession);
const mockUseTenantMode = vi.mocked(useTenantMode);
const mockUseConfig = vi.mocked(useConfig);

const connected = { authenticated: true, user: { person: { display: 'Awa Ndong' } } };

function openAt(path: string) {
  window.history.pushState({}, '', path);
}

describe('SessionGuard', () => {
  beforeEach(() => {
    Object.assign(window, { getEgenBase: () => '/', getEgenSpaBase: () => '/spa/' });
    mockUseConfig.mockReturnValue({ session: { loginRoute: '/login', homeRoute: '${egenSpaBase}/home' } });
    mockUseTenantMode.mockReturnValue('single');
    mockUseSession.mockReturnValue(connected as never);
    openAt('/spa/home/annuaire');
  });

  it("n'affiche jamais rien", () => {
    const { container } = render(<SessionGuard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ne fait rien pour un utilisateur authentifié', () => {
    render(<SessionGuard />);
    expect(window.location.pathname).toBe('/spa/home/annuaire');
  });

  it("renvoie vers la connexion un utilisateur sans session, en gardant la page demandée pour y revenir", () => {
    mockUseSession.mockReturnValue(null as never);
    render(<SessionGuard />);

    expect(window.location.pathname).toBe('/spa/login');
    expect(window.history.state.usr).toEqual({ referrer: '/home/annuaire' });
  });

  it("traite une session authentifiée mais sans personne comme non connectée (comportement d'origine)", () => {
    mockUseSession.mockReturnValue({ authenticated: true, user: {} } as never);
    render(<SessionGuard />);

    expect(window.location.pathname).toBe('/spa/login');
  });

  it("renvoie aussi quand la session existe mais n'est pas authentifiée", () => {
    mockUseSession.mockReturnValue({ authenticated: false } as never);
    render(<SessionGuard />);

    expect(window.location.pathname).toBe('/spa/login');
  });

  it("en mode multi-tenant, ne fait rien : le garde du tenant redirige déjà (jamais deux navigations)", () => {
    mockUseSession.mockReturnValue(null as never);
    mockUseTenantMode.mockReturnValue('multi');
    render(<SessionGuard />);

    expect(window.location.pathname).toBe('/spa/home/annuaire');
  });

  it("en mode off, redirige comme en mode single", () => {
    mockUseSession.mockReturnValue(null as never);
    mockUseTenantMode.mockReturnValue('off');
    render(<SessionGuard />);

    expect(window.location.pathname).toBe('/spa/login');
  });

  it.each(['/spa/login', '/spa/logout', '/spa/change-password', '/spa/login/location'])(
    'ne renvoie pas depuis une route publique (%s)',
    (path) => {
      mockUseSession.mockReturnValue(null as never);
      openAt(path);
      render(<SessionGuard />);

      expect(window.location.pathname).toBe(path);
    },
  );

  it('la route de connexion est celle de la configuration', () => {
    mockUseSession.mockReturnValue(null as never);
    mockUseConfig.mockReturnValue({ session: { loginRoute: '/connexion', homeRoute: '${egenSpaBase}/home' } });
    render(<SessionGuard />);

    expect(window.location.pathname).toBe('/spa/connexion');
  });
});
