/**
 * Noms des slots sur lesquels les apps déclarent leurs entrées de navigation, le nom officiel d'abord.
 *
 * Miroir de `TOPBAR_NAV_SLOTS` du framework (`@egen-civitas/esm-extensions`, qui est le contrat partagé avec le
 * panneau de section du rail). Il est dupliqué ici le temps que la version du framework qui l'exporte soit publiée
 * et adoptée par ce monorepo ; à ce moment, remplacer ce fichier par `import { TOPBAR_NAV_SLOTS }`.
 *
 * Le second nom est l'ancien (`topbar-level2-nav`, de l'époque à deux niveaux) : toujours lu, tant que des apps
 * déjà déployées le déclarent.
 */
export const NAV_SLOTS: readonly string[] = ['topbar-nav-slot', 'topbar-level2-nav'];
