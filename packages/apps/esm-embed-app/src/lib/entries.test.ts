import { describe, expect, it, vi } from 'vitest';
import { findEntry, loadEmbedConfig, parseEmbedConfig } from './entries';

const entry = (route: string, over: Record<string, unknown> = {}) => ({
  name: `@civitas/esm-${route}-app`,
  version: '1.0.0',
  route,
  manifest: { url: 'https://studio.exemple.org', capabilities: {}, route },
  approved: {},
  limits: {},
  ...over,
});

describe('parseEmbedConfig', () => {
  it('accepte une configuration valide et normalise limits', () => {
    const c = parseEmbedConfig({ version: 1, apps: [entry('studio', { limits: undefined })] });
    expect(c.apps).toHaveLength(1);
    expect(c.apps[0].limits).toEqual({});
  });
  it('rejette un format inattendu et ignore les entrées tronquées', () => {
    expect(() => parseEmbedConfig(null)).toThrow(/format inattendu/);
    expect(() => parseEmbedConfig({ version: 2, apps: [] })).toThrow();
    const c = parseEmbedConfig({ version: 1, apps: [entry('a'), { name: 'x' }, entry('b', { manifest: { capabilities: {} } }), entry('c', { approved: null })] });
    expect(c.apps.map((a) => a.route)).toEqual(['a']);
  });
});

describe('loadEmbedConfig', () => {
  it('lit <spa>/embed-apps.json sans cache', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ version: 1, apps: [entry('studio')] }), { status: 200 }));
    const c = await loadEmbedConfig('/egen/spa', fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).toHaveBeenCalledWith('/egen/spa/embed-apps.json', { cache: 'no-store', credentials: 'same-origin' });
    expect(c.apps[0].route).toBe('studio');
  });
  it('erreur HTTP', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }));
    await expect(loadEmbedConfig('/egen/spa/', fetchImpl as unknown as typeof fetch)).rejects.toThrow(/HTTP 404/);
  });
});

describe('findEntry', () => {
  const config = parseEmbedConfig({ version: 1, apps: [entry('studio'), entry('penpot')] });
  it('retrouve l’app d’après l’URL du Core', () => {
    expect(findEntry(config, '/egen/spa/studio', '/egen/spa/')?.route).toBe('studio');
    expect(findEntry(config, '/egen/spa/penpot/dashboard/x', '/egen/spa/')?.route).toBe('penpot');
  });
  it('aucune correspondance : undefined (pas de préfixe partiel)', () => {
    expect(findEntry(config, '/egen/spa/studios', '/egen/spa/')).toBeUndefined();
    expect(findEntry(config, '/egen/spa/autre', '/egen/spa/')).toBeUndefined();
  });
});
