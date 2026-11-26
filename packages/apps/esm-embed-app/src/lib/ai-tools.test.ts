import { describe, expect, it, vi } from 'vitest';
import { embedToolId, toToolDefinition, toToolParams } from './ai-tools';

describe('toToolParams', () => {
  it('JSON Schema simple → paramètres du Core (types sûrs, required, enum)', () => {
    const p = toToolParams({
      properties: { name: { type: 'string', description: 'Nom du thème' }, count: { type: 'number' }, mode: { type: 'string', enum: ['light', 'dark'] }, weird: { type: 'null' }, bad: null },
      required: ['name'],
    });
    expect(p.name).toEqual({ type: 'string', description: 'Nom du thème', required: true });
    expect(p.count).toEqual({ type: 'number', description: 'count' });
    expect(p.mode.enum).toEqual(['light', 'dark']);
    expect(p.weird.type).toBe('object');
    expect(p.bad).toBeUndefined();
  });
  it('schéma absent ou invalide : aucun paramètre', () => {
    expect(toToolParams(undefined)).toEqual({});
    expect(toToolParams({ properties: 'x' })).toEqual({});
  });
});

describe('toToolDefinition', () => {
  it('identifiant stable et préfixé par le module', () => {
    expect(embedToolId('@civitas/esm-studio-app', 'apply')).toBe('embed.civitas-esm-studio-app.apply');
  });
  it('exécute via le canal de l’hôte : succès et échec sans fuite de pile', async () => {
    const invoke = vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (args.boom) throw new Error('refusé par l’app');
      return { name, args };
    });
    const def = toToolDefinition('@civitas/esm-studio-app', { name: 'apply', description: 'Applique', inputSchema: { properties: { id: { type: 'string' } } } }, invoke);
    expect(def.id).toBe('embed.civitas-esm-studio-app.apply');
    expect(def.moduleName).toBe('@civitas/esm-studio-app');
    expect(def.metadata).toEqual({ source: 'embedded-app' });
    const ok = await def.execute({ executionId: 'e1', args: { id: '7' } });
    expect(ok).toMatchObject({ success: true, data: { name: 'apply', args: { id: '7' } } });
    const ko = await def.execute({ executionId: 'e2', args: { boom: true } });
    expect(ko).toMatchObject({ success: false, error: 'refusé par l’app' });
    expect(JSON.stringify(ko)).not.toMatch(/at .*\.ts/);
  });
});
