import { describe, it, expect, vi } from 'vitest';
import type { NavEntryMeta } from '@egen-civitas/esm-framework';
import { buildNavItemsFromSlot } from './buildNavItemsFromSlot';
import { type SlotNavEntry } from '../hooks/useSlotNavEntries';

// Même règle que `isNavEntryInWorkspace` du framework (absent, vide ou '*' = tous les espaces).
vi.mock('@egen-civitas/esm-framework', () => ({
  isNavEntryInWorkspace: (meta: { workspaces?: string[] }, id: string) =>
    !meta.workspaces || meta.workspaces.length === 0 || meta.workspaces.includes('*') || meta.workspaces.includes(id),
}));
vi.mock('../data/navIcons', () => ({ resolveNavIcon: (name?: string) => name ?? 'fallback' }));

const t = (_key: string, fallback: string) => fallback;

let n = 0;
const entry = (over: Partial<NavEntryMeta> = {}, name = `ext-${++n}`): SlotNavEntry => ({
  name,
  meta: {
    section: 'annuaire',
    sectionLabel: 'Annuaire',
    group: 'collaborateurs',
    groupLabel: 'Collaborateurs',
    label: 'Tous les Contacts',
    route: 'annuaire/contacts',
    ...over,
  },
});

describe('buildNavItemsFromSlot', () => {
  it('sans aucune entrée déclarée : niveau 2 vide (rien de codé en dur)', () => {
    expect(buildNavItemsFromSlot([], 'intranet', t)).toEqual([]);
  });

  it('regroupe en section > colonnes > liens, dans l\'ordre du slot', () => {
    const out = buildNavItemsFromSlot(
      [
        entry({}, 'a-contacts'),
        entry({ label: 'Organigramme', route: 'annuaire/organigramme' }, 'a-orga'),
        entry({ group: 'structures', groupLabel: 'Structures & Sites', label: 'Pôles', route: '/annuaire/structures' }, 'a-poles'),
      ],
      'intranet',
      t,
    );
    expect(out).toHaveLength(1);
    const [annuaire] = out;
    expect(annuaire.label).toBe('Annuaire');
    expect(annuaire.sectionKey).toBe('annuaire');
    expect(annuaire.subMenus?.map((g) => g.title)).toEqual(['Collaborateurs', 'Structures & Sites']);
    expect(annuaire.subMenus?.[0].items.map((i) => [i.entryName, i.link, i.route])).toEqual([
      ['a-contacts', '/annuaire/contacts', 'annuaire/contacts'],
      ['a-orga', '/annuaire/organigramme', 'annuaire/organigramme'],
    ]);
    expect(annuaire.subMenus?.[1].items[0].route).toBe('annuaire/structures');
  });

  it('une app peut contribuer à la section d\'une autre app', () => {
    const out = buildNavItemsFromSlot(
      [entry({}, 'annuaire-app'), entry({ group: 'plus', groupLabel: 'Plus', label: 'Export', route: 'annuaire/export' }, 'autre-app')],
      'intranet',
      t,
    );
    expect(out).toHaveLength(1);
    expect(out[0].subMenus?.map((g) => g.title)).toEqual(['Collaborateurs', 'Plus']);
  });

  describe('contexte par espace', () => {
    const entries = [
      entry({ section: 'informations', sectionLabel: 'Informations', group: 'news', label: 'À la Une', route: 'informations/news', workspaces: ['intranet'] }, 'info-1'),
      entry({ section: 'partenaires', sectionLabel: 'Partenaires', group: 'projets', label: 'Projets', route: 'partenaires/projets', workspaces: ['extranet'] }, 'par-1'),
      entry({ section: 'aide', sectionLabel: 'Aide', group: undefined, label: 'Aide', route: 'aide', workspaces: ['*'] }, 'aide-1'),
      entry({ section: 'recherche', sectionLabel: 'Recherche', group: undefined, label: 'Recherche', route: 'recherche' }, 'rech-1'),
    ];

    it('ne retient que les entrées visibles dans l\'espace actif', () => {
      expect(buildNavItemsFromSlot(entries, 'intranet', t).map((i) => i.sectionKey)).toEqual(['informations', 'aide', 'recherche']);
      expect(buildNavItemsFromSlot(entries, 'extranet', t).map((i) => i.sectionKey)).toEqual(['partenaires', 'aide', 'recherche']);
    });

    it('un espace sans entrée déclarée a un niveau 2 vide', () => {
      expect(buildNavItemsFromSlot([entries[0]], 'public', t)).toEqual([]);
    });

    it('une section est composée des seules entrées visibles dans l\'espace', () => {
      const mixed = [
        entry({ label: 'Contacts', route: 'annuaire/contacts', workspaces: ['intranet', 'extranet'] }, 'm-1'),
        entry({ label: 'Interne', route: 'annuaire/interne', workspaces: ['intranet'] }, 'm-2'),
      ];
      const labels = (id: string) => buildNavItemsFromSlot(mixed, id, t)[0].subMenus?.[0].items.map((i) => i.label);
      expect(labels('intranet')).toEqual(['Contacts', 'Interne']);
      expect(labels('extranet')).toEqual(['Contacts']);
    });
  });

  describe('forme du bouton de section', () => {
    it('une entrée unique sans groupe devient un bouton direct (pas de menu)', () => {
      const [item] = buildNavItemsFromSlot([entry({ section: 'recherche', sectionLabel: 'Recherche', group: undefined, label: 'Recherche', route: '/recherche' }, 'r-1')], 'intranet', t);
      expect(item.subMenus).toBeUndefined();
      expect(item).toMatchObject({ link: '/recherche', route: 'recherche', entryName: 'r-1', sectionKey: 'recherche' });
    });

    it('plusieurs entrées sans groupe : une colonne sans titre', () => {
      const [item] = buildNavItemsFromSlot(
        [
          entry({ section: 'outils', sectionLabel: 'Outils', group: undefined, label: 'A', route: 'outils/a' }, 'o-1'),
          entry({ section: 'outils', group: undefined, label: 'B', route: 'outils/b' }, 'o-2'),
        ],
        'intranet',
        t,
      );
      expect(item.subMenus).toHaveLength(1);
      expect(item.subMenus?.[0].title).toBe('');
      expect(item.subMenus?.[0].items.map((i) => i.label)).toEqual(['A', 'B']);
      expect(item.link).toBeUndefined();
    });

    it('entrées sans groupe et groupées : la colonne sans titre passe en tête', () => {
      const [item] = buildNavItemsFromSlot(
        [
          entry({ section: 'x', sectionLabel: 'X', group: 'g', groupLabel: 'G', label: 'Grp', route: 'x/g' }, 'x-1'),
          entry({ section: 'x', group: undefined, label: 'Libre', route: 'x/libre' }, 'x-2'),
        ],
        'intranet',
        t,
      );
      expect(item.subMenus?.map((c) => c.title)).toEqual(['', 'G']);
    });

    it('sectionRoute rend le bouton de section cliquable en plus de son menu', () => {
      const [item] = buildNavItemsFromSlot(
        [entry({ sectionRoute: 'annuaire' }, 'a-1'), entry({ label: 'Orga', route: 'annuaire/organigramme' }, 'a-2')],
        'intranet',
        t,
      );
      expect(item.subMenus?.[0].items).toHaveLength(2);
      expect(item).toMatchObject({ link: '/annuaire', route: 'annuaire' });
    });
  });

  it('traduit libellés et descriptions via les clés, avec repli sur le texte', () => {
    const tr = (key: string, fallback: string) => (key === 'k.label' ? 'Traduit' : fallback);
    const [item] = buildNavItemsFromSlot(
      [entry({ labelKey: 'k.label', descriptionKey: 'k.missing', description: 'Défaut', sectionLabelKey: 'k.none', sectionLabel: 'Section' }, 'a-1')],
      'intranet',
      tr,
    );
    expect(item.label).toBe('Section');
    expect(item.subMenus?.[0].items[0]).toMatchObject({ label: 'Traduit', description: 'Défaut' });
  });

  it('attribue des identifiants uniques et stables dans l\'ordre', () => {
    const out = buildNavItemsFromSlot(
      [entry({ section: 'a', sectionLabel: 'A', group: undefined, route: 'a' }, 'e1'), entry({ section: 'b', sectionLabel: 'B', group: undefined, route: 'b' }, 'e2')],
      'intranet',
      t,
    );
    expect(out.map((i) => i.id)).toEqual([1, 2]);
  });
});
