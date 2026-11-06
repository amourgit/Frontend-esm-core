export interface OfflineToolsPageConfig {
  name: string;
  slot: string;
}

/**
 * Entité rendue disponible hors ligne : un identifiant et un nom affichable. Tout autre champ est libre ;
 * il est fusionné tel quel lors des mises à jour enregistrées hors ligne.
 */
export interface OfflineEntity {
  id: string;
  name?: string;
  [key: string]: unknown;
}
