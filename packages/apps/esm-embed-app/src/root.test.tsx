import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/core-services', () => ({
  coreServices: {
    getSession: () => ({ authenticated: true }),
    subscribeSession: () => () => undefined,
    getLocale: () => 'fr',
    getTenantId: () => undefined,
    isFeatureEnabled: () => false,
    userHasAccess: () => false,
    notify: () => undefined,
    log: () => undefined,
  },
}));

import Root from './root.component';
import { resetEmbedConfigCache } from './lib/entries';

const manifest = (over: Record<string, unknown> = {}) => ({
  manifestVersion: 1, name: '@civitas/esm-studio-app', version: '1.0.0', title: 'Studio', url: 'https://studio.exemple.org', route: 'studio', technology: 'nextjs',
  navigation: { mode: 'history' }, capabilities: { locale: {}, notifications: {} }, ...over,
});
const config = (apps: unknown[]) => ({ version: 1, apps });
const entry = (over: Record<string, unknown> = {}) => ({ name: '@civitas/esm-studio-app', version: '1.0.0', route: 'studio', manifest: manifest(), approved: { notifications: {} }, limits: {}, config: {}, contributions: [], ...over });

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));
}

beforeEach(() => {
  resetEmbedConfigCache();
  window.history.pushState({}, '', '/egen/spa/studio');
});
afterEach(() => void vi.unstubAllGlobals());

describe('Root (app générique)', () => {
  it('charge embed-apps.json, retrouve l’app par la route et monte l’iframe sécurisée', async () => {
    mockFetch(config([entry()]));
    render(<Root />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    const iframe = await screen.findByTitle('Studio');
    expect(iframe).toHaveAttribute('src', 'https://studio.exemple.org');
    expect(iframe).toHaveAttribute('sandbox', expect.stringContaining('allow-scripts'));
    expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    expect(fetch).toHaveBeenCalledWith('/egen/spa/embed-apps.json', expect.objectContaining({ cache: 'no-store' }));
  });

  it('route non déclarée : message explicite, aucune iframe', async () => {
    window.history.pushState({}, '', '/egen/spa/inconnue');
    mockFetch(config([entry()]));
    render(<Root />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTitle('Studio')).not.toBeInTheDocument();
  });

  it('configuration indisponible : message explicite', async () => {
    mockFetch({}, 503);
    render(<Root />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Impossible de charger/);
  });

  it('démontage : l’iframe est retirée', async () => {
    mockFetch(config([entry()]));
    const { unmount } = render(<Root />);
    await screen.findByTitle('Studio');
    unmount();
    expect(screen.queryByTitle('Studio')).not.toBeInTheDocument();
  });
});
