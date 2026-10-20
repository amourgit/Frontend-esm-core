import { describe, it, expect, vi, beforeEach } from 'vitest';

const behaviors = new Map<string, { onSelect: (ctx: unknown) => void }>();
vi.mock('@egen-civitas/esm-framework', () => ({
  getNavBehavior: (target: { entry?: string; section?: string }) =>
    behaviors.get('entry' in target ? `entry:${target.entry}` : `section:${target.section}`),
}));

import { bindNavSelection, selectNavTarget } from './navSelection';
import { type NavItem } from '../components/shell/DropdownNavigation';

const Icon = () => null;
const items: NavItem[] = [
  { id: 1, label: 'Accueil', sectionKey: 'home', entryName: 'home-nav', route: 'home', link: '/home' },
  {
    id: 2,
    label: 'Annuaire',
    sectionKey: 'annuaire',
    route: 'annuaire',
    subMenus: [{ title: 'Collab', items: [{ label: 'Contacts', icon: Icon, route: 'annuaire/contacts', entryName: 'a-contacts' }] }],
  },
];

describe('sélection d\'un bouton de navigation', () => {
  beforeEach(() => behaviors.clear());

  it('sans comportement déclaré : applique la logique globale avec la route', () => {
    const runDefault = vi.fn();
    selectNavTarget({ entry: 'a-contacts' }, 'annuaire/contacts', { workspaceId: 'intranet', runDefault });
    expect(runDefault).toHaveBeenCalledWith('annuaire/contacts');
  });

  it('un comportement REMPLACE la logique globale s\'il n\'appelle pas runDefault', () => {
    const onSelect = vi.fn();
    behaviors.set('entry:a-contacts', { onSelect });
    const runDefault = vi.fn();
    selectNavTarget({ entry: 'a-contacts' }, 'annuaire/contacts', { workspaceId: 'extranet', runDefault });
    expect(runDefault).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ target: { entry: 'a-contacts' }, route: 'annuaire/contacts', workspaceId: 'extranet' }),
    );
  });

  it('un comportement peut ENRICHIR la logique globale via ctx.runDefault()', () => {
    const order: string[] = [];
    behaviors.set('entry:a-contacts', {
      onSelect: ({ runDefault }: any) => {
        order.push('avant');
        runDefault();
      },
    });
    selectNavTarget({ entry: 'a-contacts' }, 'annuaire/contacts', { workspaceId: 'intranet', runDefault: () => order.push('défaut') });
    expect(order).toEqual(['avant', 'défaut']);
  });

  it('bindNavSelection cible l\'entrée (bouton direct / sous-option) ou la section (bouton à menu)', () => {
    const runDefault = vi.fn();
    const seen: unknown[] = [];
    behaviors.set('section:annuaire', { onSelect: (c: any) => seen.push(c.target) });
    behaviors.set('entry:home-nav', { onSelect: (c: any) => seen.push(c.target) });
    behaviors.set('entry:a-contacts', { onSelect: (c: any) => seen.push(c.target) });

    const bound = bindNavSelection(items, { workspaceId: 'intranet', runDefault });
    bound[0].onClick?.();
    bound[1].onClick?.();
    bound[1].subMenus?.[0].items[0].onClick?.();
    expect(seen).toEqual([{ entry: 'home-nav' }, { section: 'annuaire' }, { entry: 'a-contacts' }]);
    expect(runDefault).not.toHaveBeenCalled();
  });

  it('un comportement enregistré après la construction est pris en compte au clic', () => {
    const runDefault = vi.fn();
    const bound = bindNavSelection(items, { workspaceId: 'intranet', runDefault });
    bound[1].subMenus?.[0].items[0].onClick?.();
    expect(runDefault).toHaveBeenCalledWith('annuaire/contacts');
    const onSelect = vi.fn();
    behaviors.set('entry:a-contacts', { onSelect });
    bound[1].subMenus?.[0].items[0].onClick?.();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
