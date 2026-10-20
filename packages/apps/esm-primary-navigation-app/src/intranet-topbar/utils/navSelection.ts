import { getNavBehavior, type NavBehaviorTarget } from '@egen-civitas/esm-framework';
import { type NavItem, type NavSubMenuItem } from '../components/shell/DropdownNavigation';

export interface NavSelectionDeps {
  workspaceId: string;
  /** Logique globale de la TopBar : son, fermeture du menu, navigation vers `route` (si présente). */
  runDefault: (route?: string) => void;
}

/**
 * Applique la logique de sélection d'un bouton du niveau 2 : si une app a déclaré un comportement
 * (`registerNavBehavior`) pour cette cible, c'est lui qui s'exécute (il peut rappeler `runDefault`) ;
 * sinon la logique globale s'applique. Lu au moment du clic : un comportement enregistré tardivement
 * est pris en compte sans reconstruire la navigation.
 */
export function selectNavTarget(target: NavBehaviorTarget, route: string | undefined, deps: NavSelectionDeps): void {
  const runDefault = () => deps.runDefault(route);
  // Absent d'un shell antérieur à esm-framework 1.2 : on applique alors la logique globale.
  const behavior = typeof getNavBehavior === 'function' ? getNavBehavior(target) : undefined;
  if (behavior) {
    behavior.onSelect({ target, route, workspaceId: deps.workspaceId, runDefault });
  } else {
    runDefault();
  }
}

/** Branche les `onClick` (comportement d'app ou logique globale) sur toute l'arborescence construite. */
export function bindNavSelection(items: NavItem[], deps: NavSelectionDeps): NavItem[] {
  return items.map((item) => {
    const itemTarget: NavBehaviorTarget = item.entryName ? { entry: item.entryName } : { section: item.sectionKey ?? '' };
    return {
      ...item,
      onClick: () => selectNavTarget(itemTarget, item.route, deps),
      subMenus: item.subMenus?.map((sub) => ({
        ...sub,
        items: sub.items.map(
          (entry): NavSubMenuItem => ({
            ...entry,
            onClick: () => selectNavTarget({ entry: entry.entryName ?? '' }, entry.route, deps),
          }),
        ),
      })),
    };
  });
}
