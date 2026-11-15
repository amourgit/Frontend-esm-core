import { describe, it, expect, vi } from 'vitest';

// Simule un shell livré avec un framework antérieur à 1.2 : ces exports n'existent pas à l'exécution.
vi.mock('@egen-civitas/esm-framework', () => ({ isNavEntryInWorkspace: undefined, getNavBehavior: undefined }));
vi.mock('../data/navIcons', () => ({ resolveNavIcon: (name?: string) => name ?? 'fallback' }));

import { buildNavItemsFromSlot } from './buildNavItemsFromSlot';
import { selectNavTarget } from './navSelection';

const t = (_k: string, f: string) => f;
const entry = (name: string, workspaces?: string[]) => ({
  name,
  meta: { section: 's', sectionLabel: 'S', label: name, route: `s/${name}`, ...(workspaces ? { workspaces } : {}) },
});

describe('compatibilité avec un shell dont le framework est antérieur à 1.2', () => {
  it('la navigation se construit et filtre par espace sans planter', () => {
    const entries = [entry('a'), entry('b', ['extranet']), entry('c', ['*']), entry('d', ['intranet'])];
    const labels = (id: string) => buildNavItemsFromSlot(entries, id, t)[0].subMenus?.[0].items.map((i) => i.label);
    expect(labels('intranet')).toEqual(['a', 'c', 'd']);
    expect(labels('extranet')).toEqual(['a', 'b', 'c']);
  });

  it('un clic applique la logique globale (aucun comportement d\'app disponible)', () => {
    const runDefault = vi.fn();
    selectNavTarget({ entry: 'a' }, 's/a', { workspaceId: 'intranet', runDefault });
    expect(runDefault).toHaveBeenCalledWith('s/a');
  });
});
