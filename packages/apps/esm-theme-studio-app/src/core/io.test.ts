import { describe, expect, it } from 'vitest';
import { exportThemeJson, importThemeText, themeFileName } from './import-export';
import { createThemeLibrary, memoryStorage } from './library';
import { validateTheme } from './validation';

const ok = { priority: 2, colors: { primary: { '50': '#fff', '100': '#eee', '200': '#ddd', '300': '#ccc', '400': '#bbb', '500': '#aaa', '600': '#999', '700': '#888', '800': '#777', '900': '#666', '950': '#555' } } };

describe('validateTheme', () => {
  it('accepte un thème correct', () => {
    expect(validateTheme(ok)).toEqual({ valid: true, issues: [] });
  });
  it('refuse les injections CSS', () => {
    const r = validateTheme({ radius: 'red; } body { display:none', shadows: { md: '0 0 0 red /* x */' } });
    expect(r.valid).toBe(false);
    expect(r.issues.filter((i) => i.severity === 'error').map((i) => i.path).sort()).toEqual(['radius', 'shadows.md']);
  });
  it('avertit pour couleur douteuse et échelle incomplète', () => {
    const r = validateTheme({ colors: { primary: { '500': 'banana' }, surface: { light: { background: 'nope' } } } });
    expect(r.valid).toBe(true);
    expect(r.issues.map((i) => i.path)).toEqual(expect.arrayContaining(['colors.primary.500', 'colors.primary', 'colors.surface.light.background']));
  });
  it('refuse un non-objet et une priorité invalide', () => {
    expect(validateTheme([]).valid).toBe(false);
    expect(validateTheme({ priority: 'x' }).valid).toBe(false);
  });
});

describe('importThemeText', () => {
  it('importe un JSON EGEN, avec ou sans enveloppe', () => {
    expect(importThemeText(JSON.stringify(ok))).toMatchObject({ ok: true, format: 'egen' });
    expect(importThemeText(JSON.stringify({ theme: ok })).doc).toEqual(ok);
  });
  it('importe du CSS TweakCN par-dessus un thème de base', () => {
    const r = importThemeText(':root{--primary:#ff0000;--background:#fff} .dark{--background:#000}', { priority: 7, zIndex: { modal: 50 } });
    expect(r).toMatchObject({ ok: true, format: 'tweakcn-css' });
    expect(r.doc).toMatchObject({ priority: 7, zIndex: { modal: 50 } });
  });
  it('importe un registry JSON TweakCN', () => {
    expect(importThemeText(JSON.stringify({ cssVars: { light: { primary: '#123456' }, dark: {} } }))).toMatchObject({ ok: true, format: 'tweakcn-registry' });
  });
  it('neutralise __proto__ et refuse JSON cassé / format inconnu / vide', () => {
    const r = importThemeText('{"__proto__":{"polluted":1},"priority":1}');
    expect(({} as any).polluted).toBeUndefined();
    expect(r.ok).toBe(true);
    expect(importThemeText('{oops').ok).toBe(false);
    expect(importThemeText('hello').format).toBe('unknown');
    expect(importThemeText('  ').ok).toBe(false);
  });
  it('un thème invalide n’est pas retourné', () => {
    const r = importThemeText(JSON.stringify({ radius: '1px; }' }));
    expect(r.ok).toBe(false);
    expect(r.doc).toBeUndefined();
  });
});

describe('export', () => {
  it('conserve toute la richesse et se réimporte à l’identique', () => {
    const rich = { ...ok, zIndex: { modal: 50 }, panel: { light: { card: { background: 'x' } } }, components: { button: { primary: { hover: { background: { light: '#1', dark: '#2' } } } } } };
    const text = exportThemeJson(rich, { name: 'Mon thème' });
    const back = importThemeText(text);
    expect(back.ok).toBe(true);
    const { meta, ...rest } = back.doc as any;
    expect(rest).toEqual(rich);
    expect(meta.name).toBe('Mon thème');
    expect(themeFileName('Mon Thème n°1!')).toBe('mon-th-me-n-1.theme.json');
  });
});

describe('bibliothèque', () => {
  it('crée, enregistre, duplique, active et supprime', () => {
    const lib = createThemeLibrary(memoryStorage());
    const a = lib.create('Océan', ok);
    const b = lib.create('Océan', ok);
    expect([a.id, b.id]).toEqual(['oc-an', 'oc-an-2']);
    lib.save(a.id, { ...ok, priority: 9 });
    expect((lib.get(a.id)!.doc as any).priority).toBe(9);
    const copy = lib.duplicate(a.id)!;
    expect(copy.name).toBe('Océan (copie)');
    lib.setActive(copy.id);
    expect(lib.getActiveId()).toBe(copy.id);
    expect(lib.remove(copy.id)).toBe(true);
    expect(lib.getActiveId()).toBeNull();
    expect(lib.list()).toHaveLength(2);
    expect(lib.remove('inconnu')).toBe(false);
  });
  it('résiste à un stockage corrompu', () => {
    const s = memoryStorage();
    s.setItem('egen-theme-studio:index', '{pas du json');
    expect(createThemeLibrary(s).list()).toEqual([]);
  });
});
