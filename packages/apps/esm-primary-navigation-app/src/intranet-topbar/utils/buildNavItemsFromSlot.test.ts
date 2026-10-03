import { describe, it, expect, vi } from 'vitest';
import type { NavEntryMeta } from '@egen-civitas/esm-framework';
import { buildNavItemsFromSlot } from './buildNavItemsFromSlot';

vi.mock('@egen-civitas/esm-framework', () => ({}));

const t = (key: string, fallback: string) => fallback;

const base = [
  { id: 1, label: 'Accueil', link: '/home' },
  { id: 2, label: 'Informations', link: '/informations', subMenus: [{ title: 'Ancien', items: [] }] },
  { id: 5, label: 'Annuaire', link: '/annuaire' },
  { id: 6, label: 'Administration', link: '/administration', subMenus: [{ title: 'Maquette', items: [] }] },
];

const entry = (over: Partial<NavEntryMeta> = {}): NavEntryMeta => ({
  section: 'annuaire',
  sectionLabel: 'Annuaire',
  group: 'collaborateurs',
  groupLabel: 'Collaborateurs',
  label: 'Tous les Contacts',
  route: 'annuaire/contacts',
  ...over,
});

describe('buildNavItemsFromSlot', () => {
  it('sans entrée déclarée : conserve la maquette telle quelle', () => {
    expect(buildNavItemsFromSlot(base as never, [], t)).toBe(base);
  });

  it("remplace les sous-menus de l'item de même section, sans toucher aux autres", () => {
    const out = buildNavItemsFromSlot(
      base as never,
      [
        entry(),
        entry({ label: 'Organigramme', route: 'annuaire/organigramme' }),
        entry({ group: 'structures', groupLabel: 'Structures & Sites', label: 'Pôles', route: '/annuaire/structures' }),
      ],
      t,
    );
    const annuaire = out.find((i) => i.label === 'Annuaire')!;
    expect(annuaire.subMenus?.map((g) => g.title)).toEqual(['Collaborateurs', 'Structures & Sites']);
    expect(annuaire.subMenus?.[0].items.map((i) => i.link)).toEqual(['/annuaire/contacts', '/annuaire/organigramme']);
    expect(annuaire.subMenus?.[1].items[0].link).toBe('/annuaire/structures');
    // Section absente du slot : la maquette reste.
    expect(out.find((i) => i.label === 'Administration')?.subMenus?.[0].title).toBe('Maquette');
    // L'ordre des entrées de niveau 2 n'est pas modifié.
    expect(out.map((i) => i.id)).toEqual([1, 2, 5, 6]);
  });

  it("ajoute à la fin une section qui n'existe pas dans la maquette", () => {
    const out = buildNavItemsFromSlot(
      base as never,
      [
        entry({
          section: 'sites',
          sectionLabel: 'Sites',
          group: 'g',
          groupLabel: 'G',
          label: 'Site A',
          route: 'sites/a',
        }),
      ],
      t,
    );
    const last = out[out.length - 1];
    expect(last).toMatchObject({ id: 7, label: 'Sites', link: '/sites' });
    expect(last.subMenus?.[0].items[0].link).toBe('/sites/a');
  });

  it('traduit les libellés via leur clé, avec le texte par défaut en repli', () => {
    const tr = vi.fn((key: string, fallback: string) => (key === 'nav.contacts' ? 'Contacts (traduit)' : fallback));
    const out = buildNavItemsFromSlot(base as never, [entry({ labelKey: 'nav.contacts' })], tr);
    expect(out.find((i) => i.label === 'Annuaire')?.subMenus?.[0].items[0].label).toBe('Contacts (traduit)');
  });
});
