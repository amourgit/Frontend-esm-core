import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@egen-civitas/esm-framework', async () => {
  const react = await import('react');
  return {
    ComponentContext: react.createContext({ moduleName: 'm', featureName: 'f' }),
    getExtensionRegistration: vi.fn(),
  };
});
vi.mock('./lib/core-services', () => ({
  coreServices: { getLocale: () => 'fr', getTenantId: () => undefined, isFeatureEnabled: () => false, notify: () => undefined, confirm: async () => true, log: () => undefined, listExtensions: () => [], subscribeExtensions: () => () => undefined, registerAiTools: () => undefined, unregisterAiTools: () => undefined },
}));

import { ComponentContext, getExtensionRegistration } from '@egen-civitas/esm-framework';
import ExtensionView from './extension-view.component';
import { resetEmbedConfigCache } from './lib/entries';

const manifest = { manifestVersion: 1, name: '@civitas/esm-studio-app', version: '1.0.0', title: 'Studio', url: 'https://studio.exemple.org', route: 'studio', technology: 'nextjs', navigation: { mode: 'history' }, capabilities: { locale: {} } };
const entry = (contributions: unknown[]) => ({ name: '@civitas/esm-studio-app', version: '1.0.0', route: 'studio', manifest, approved: {}, limits: {}, config: {}, contributions });

function withExtension(meta: unknown) {
  vi.mocked(getExtensionRegistration).mockReturnValue(meta === undefined ? undefined : ({ meta } as never));
  return render(
    <ComponentContext.Provider value={{ moduleName: 'm', featureName: 'f', extension: { extensionId: 'ext-1', extensionSlotName: 's', extensionSlotModuleName: 'sm' } }}>
      <ExtensionView />
    </ComponentContext.Provider>,
  );
}

beforeEach(() => resetEmbedConfigCache());
afterEach(() => void vi.unstubAllGlobals());

const stubConfig = (apps: unknown[]) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ version: 1, apps }), { status: 200 })));

describe('ExtensionView', () => {
  it('affiche la vue de l’app dans le slot : iframe sur manifest.url + view, hauteur minimale de la contribution', async () => {
    stubConfig([entry([{ name: 'chip', slot: 'topbar-actions-slot', view: '/_egen/chip', height: 56 }])]);
    withExtension({ embed: { app: '@civitas/esm-studio-app', ext: 'chip' } });
    const iframe = await screen.findByTitle('Studio');
    expect(iframe).toHaveAttribute('src', 'https://studio.exemple.org/_egen/chip');
    expect(iframe).toHaveAttribute('sandbox', expect.stringContaining('allow-scripts'));
    expect(iframe).toHaveStyle({ minHeight: '56px' });
  });

  it('contribution inconnue, sans vue, ou app inconnue : le slot reste vide (il ne casse jamais l’interface hôte)', async () => {
    stubConfig([entry([{ name: 'nav', slot: 'topbar-nav-slot' }])]);
    const { container } = withExtension({ embed: { app: '@civitas/esm-studio-app', ext: 'nav' } });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTitle('Studio')).not.toBeInTheDocument();
  });

  it('enregistrement absent ou sans meta.embed : aucun appel réseau, rien d’affiché', () => {
    stubConfig([]);
    const { container } = withExtension(undefined);
    expect(container).toBeEmptyDOMElement();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('configuration indisponible : slot vide, pas d’exception', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const { container } = withExtension({ embed: { app: '@civitas/esm-studio-app', ext: 'chip' } });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
