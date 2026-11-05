// =============================================================================
//  SLOTS HISTORIQUES — anciens noms de slots de la TopBar, toujours honorés
//
//  Avant les niveaux dynamiques, la TopBar exposait des slots nommés (`top-nav-*`). Des apps déjà déployées les
//  utilisent encore dans leur `routes.json` : chacun est rattaché ici à la région équivalente, et se comporte
//  exactement comme le slot officiel `topbar-l<N>-<région>-slot` de cette région.
//
//  Ce fichier est un TABLEAU DE COMPATIBILITÉ, pas un contrat : les nouvelles apps utilisent les slots
//  officiels. On n'y AJOUTE rien ; on le retire quand plus aucune app déployée ne s'en sert.
// =============================================================================

export const LEGACY_SLOTS: Readonly<Record<string, readonly string[]>> = {
  'l1-center': ['top-nav-info-slot'],
  'l1-right': ['top-nav-actions-slot', 'top-nav-trailing-slot'],
  'l2-left': ['top-nav-app-slot'],
  'l2-right': ['top-nav-level2-end-slot'],
};
