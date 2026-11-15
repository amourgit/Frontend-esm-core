import { Type } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM SEARCH APP — configuration runtime
//
//  La recherche de la TopBar appartient à cette app : la TopBar ne connaît ni sa destination ni son champ.
// =============================================================================

export const configSchema = {
  search: {
    path: {
      _type: Type.String,
      _default: '${egenSpaBase}/search',
      _description:
        "Route vers laquelle on navigue quand une requête est soumise depuis la barre de recherche de la TopBar (ajoutée en paramètre `?q=`). À faire pointer vers l'app qui affiche vos résultats de recherche.",
    },
  },
};

export interface ConfigSchema {
  search: {
    path: string;
  };
}
