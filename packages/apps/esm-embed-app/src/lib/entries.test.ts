import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findEntry, findEntryByName, getEmbedConfig, loadEmbedConfig, parseEmbedConfig, resetEmbedConfigCache } from './entries';

beforeEach(() => resetEmbedConfigCache());

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
    expect(c.apps[0].config).toEqual({});
    expect(c.apps[0].contributions).toEqual([]);
  });
  it('conserve la configuration et les contributions approuvées', () => {
    const c = parseEmbedConfig({ version: 1, apps: [entry('studio', { config: { a: 1 }, contributions: [{ name: 'chip', slot: 'x', view: '/v' }] })] });
    expect(c.apps[0].config).toEqual({ a: 1 });
    expect(c.apps[0].contributions).toHaveLength(1);
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

describe('getEmbedConfig (partagée entre page, vues et rail)', () => {
  it('un seul aller-retour réseau ; un échec n’est pas mis en cache', async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify({ version: 1, apps: [entry('studio')] }), { status: 200 }));
    const a = getEmbedConfig('/egen/spa/', ok as unknown as typeof fetch);
    const b = getEmbedConfig('/egen/spa/', ok as unknown as typeof fetch);
    expect(a).toBe(b);
    await a;
    expect(ok).toHaveBeenCalledTimes(1);
    resetEmbedConfigCache();
    const ko = vi.fn(async () => new Response('', { status: 500 }));
    await expect(getEmbedConfig('/egen/spa/', ko as unknown as typeof fetch)).rejects.toThrow(/HTTP 500/);
    await new Promise((r) => setTimeout(r, 0));
    await expect(getEmbedConfig('/egen/spa/', ok as unknown as typeof fetch)).resolves.toBeTruthy();
  });
  it('findEntryByName', () => {
    const c = parseEmbedConfig({ version: 1, apps: [entry('studio')] });
    expect(findEntryByName(c, '@civitas/esm-studio-app')?.route).toBe('studio');
    expect(findEntryByName(c, '@autre/app')).toBeUndefined();
  });
});
