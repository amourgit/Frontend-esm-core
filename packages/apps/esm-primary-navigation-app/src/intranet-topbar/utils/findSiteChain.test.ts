import { describe, expect, it } from 'vitest';
import { findSiteChain } from './findSiteChain';

const sites = [
  { id: 'dsi', name: 'DSI', shortName: 'DSI' },
  { id: 'dsi-infra', parentId: 'dsi', name: 'Infrastructure' },
  { id: 'dsi-infra-reseau', parentId: 'dsi-infra', name: 'Réseau' },
  { id: 'drh', name: 'DRH' },
];
const ids = (chain: Array<{ id: string }>) => chain.map((s) => s.id);

describe('findSiteChain', () => {
  it("retrouve toute la chaîne, de la racine au site le plus profond du chemin", () => {
    expect(ids(findSiteChain(sites, '/spa/sites/dsi-infra-reseau/applications'))).toEqual(['dsi', 'dsi-infra', 'dsi-infra-reseau']);
    expect(ids(findSiteChain(sites, '/spa/sites/dsi'))).toEqual(['dsi']);
  });

  it('ignore la casse du chemin', () => {
    expect(ids(findSiteChain(sites, '/SPA/Sites/DRH'))).toEqual(['drh']);
  });

  it("ne confond pas un segment qui n'est qu'un préfixe d'identifiant", () => {
    expect(findSiteChain(sites, '/spa/sites/dsi-infrastructure')).toEqual([]);
  });

  it("est vide hors d'un site, ou sans registre", () => {
    expect(findSiteChain(sites, '/spa/home')).toEqual([]);
    expect(findSiteChain([], '/spa/sites/dsi')).toEqual([]);
  });

  it('ne boucle pas sur un registre incohérent (parents circulaires, parent absent)', () => {
    const broken = [
      { id: 'a', parentId: 'b', name: 'A' },
      { id: 'b', parentId: 'a', name: 'B' },
      { id: 'c', parentId: 'inconnu', name: 'C' },
    ];
    expect(findSiteChain(broken, '/x/a').length).toBeLessThanOrEqual(2);
    expect(ids(findSiteChain(broken, '/x/c'))).toEqual(['c']);
  });

  it('tient une chaîne de 5 000 niveaux', () => {
    const deep = Array.from({ length: 5000 }, (_, i) => ({ id: `n${i}`, parentId: i === 0 ? null : `n${i - 1}`, name: `N${i}` }));
    expect(findSiteChain(deep, '/x/n4999')).toHaveLength(5000);
  });
});
