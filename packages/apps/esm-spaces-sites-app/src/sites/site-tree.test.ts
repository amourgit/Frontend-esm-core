import { describe, expect, it } from 'vitest';
import { type SiteNode } from '../store/spaces-sites.store';
import { buildSiteTree, findSiteInPathname, getChildren, getSitePath, isValidSite, mergeSiteSources } from './site-tree';

const site = (id: string, parentId?: string | null, extra: Partial<SiteNode> = {}): SiteNode => ({ id, parentId, name: `Site ${id}`, ...extra });
const ids = (nodes: SiteNode[]) => nodes.map((n) => n.id);

describe('buildSiteTree', () => {
  it('range les sites À PLAT par parent : racines et enfants', () => {
    const tree = buildSiteTree([site('a'), site('b'), site('a1', 'a'), site('a2', 'a'), site('a11', 'a1')]);

    expect(ids(getChildren(tree, null))).toEqual(['a', 'b']);
    expect(ids(getChildren(tree, 'a'))).toEqual(['a1', 'a2']);
    expect(ids(getChildren(tree, 'a1'))).toEqual(['a11']);
    expect(getChildren(tree, 'b')).toEqual([]);
    expect(tree.warnings).toEqual([]);
  });

  it("trie les frères par `order`, puis par nom (ordre français)", () => {
    const tree = buildSiteTree([
      site('z', null, { name: 'Zèbre' }),
      site('e', null, { name: 'Étoile' }),
      site('a', null, { name: 'Abeille' }),
      site('first', null, { name: 'Zzz', order: -1 }),
    ]);

    expect(ids(getChildren(tree, null))).toEqual(['first', 'a', 'e', 'z']);
  });

  it('profondeur ILLIMITÉE : 5 000 niveaux sans débordement de pile, chemin complet retrouvé', () => {
    const depth = 5000;
    const chain = Array.from({ length: depth }, (_, i) => site(`n${i}`, i === 0 ? null : `n${i - 1}`));
    const tree = buildSiteTree(chain);

    const path = getSitePath(tree, `n${depth - 1}`);
    expect(path).toHaveLength(depth);
    expect(path[0].id).toBe('n0');
    expect(path[depth - 1].id).toBe(`n${depth - 1}`);
    expect(tree.warnings).toEqual([]);
  });

  it("un parent introuvable fait du site une racine, avec un avertissement", () => {
    const tree = buildSiteTree([site('orphan', 'fantome')]);

    expect(ids(getChildren(tree, null))).toEqual(['orphan']);
    expect(tree.warnings).toEqual([expect.stringContaining('parent « fantome » introuvable')]);
  });

  it('un site qui est son propre parent devient une racine', () => {
    const tree = buildSiteTree([site('a', 'a')]);

    expect(ids(getChildren(tree, null))).toEqual(['a']);
    expect(tree.warnings).toEqual([expect.stringContaining('son propre parent')]);
  });

  it('coupe les boucles (A → B → C → A) au lieu de boucler à l’infini', () => {
    const tree = buildSiteTree([site('a', 'c'), site('b', 'a'), site('c', 'b')]);

    expect(getChildren(tree, null)).toHaveLength(1);
    expect(tree.warnings).toEqual([expect.stringContaining('boucle')]);
    // Tout reste atteignable et le chemin se termine.
    expect(getSitePath(tree, 'b').length).toBeGreaterThan(0);
  });

  it("un identifiant déclaré deux fois : la première déclaration est conservée", () => {
    const tree = buildSiteTree([site('a', null, { name: 'Premier' }), site('a', null, { name: 'Second' })]);

    expect(tree.byId.get('a')?.name).toBe('Premier');
    expect(tree.warnings).toEqual([expect.stringContaining('plusieurs fois')]);
  });

  it("traite un parentId vide comme « racine »", () => {
    const tree = buildSiteTree([site('a', ''), site('b', '  ')]);

    expect(ids(getChildren(tree, null))).toEqual(['a', 'b']);
  });
});

describe('getSitePath', () => {
  const tree = buildSiteTree([site('a'), site('a1', 'a'), site('a11', 'a1')]);

  it('va de la racine au site, inclus', () => {
    expect(ids(getSitePath(tree, 'a11'))).toEqual(['a', 'a1', 'a11']);
    expect(ids(getSitePath(tree, 'a'))).toEqual(['a']);
  });

  it('est vide pour « tous les sites » ou un site inconnu', () => {
    expect(getSitePath(tree, null)).toEqual([]);
    expect(getSitePath(tree, 'inconnu')).toEqual([]);
  });
});

describe('mergeSiteSources', () => {
  it("la source suivante complète et remplace la précédente, champ par champ, par identifiant", () => {
    const merged = mergeSiteSources([site('a', null, { name: 'Déclaré', shortName: 'DEC' }), site('b')], [site('a', null, { name: 'Renommé' }), site('c')]);

    expect(ids(merged)).toEqual(['a', 'b', 'c']);
    expect(merged[0]).toMatchObject({ name: 'Renommé', shortName: 'DEC' });
  });
});

describe('findSiteInPathname', () => {
  const tree = buildSiteTree([site('dsi'), site('dsi-infra', 'dsi'), site('dsi-infra-reseau', 'dsi-infra'), site('drh')]);

  it("trouve le site le PLUS PROFOND dont l'identifiant figure dans le chemin", () => {
    expect(findSiteInPathname(tree, '/spa/sites/dsi-infra-reseau/applications')?.id).toBe('dsi-infra-reseau');
    expect(findSiteInPathname(tree, '/spa/sites/dsi/dsi-infra')?.id).toBe('dsi-infra');
  });

  it('ignore la casse et ne confond pas un segment partiel', () => {
    expect(findSiteInPathname(tree, '/spa/sites/DRH')?.id).toBe('drh');
    expect(findSiteInPathname(tree, '/spa/sites/dsi-infrastructure')).toBeUndefined();
  });

  it("n'invente rien hors d'un site", () => {
    expect(findSiteInPathname(tree, '/spa/home')).toBeUndefined();
  });
});

describe('isValidSite', () => {
  it('exige un identifiant et un nom non vides', () => {
    expect(isValidSite({ id: 'a', name: 'A' })).toBe(true);
    expect(isValidSite({ id: '', name: 'A' })).toBe(false);
    expect(isValidSite({ id: 'a', name: '  ' })).toBe(false);
    expect(isValidSite(null)).toBe(false);
    expect(isValidSite({ id: 1, name: 'A' })).toBe(false);
  });
});
