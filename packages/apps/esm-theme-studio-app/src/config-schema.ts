import { Type } from '@egen-civitas/esm-framework';

export const configSchema = {
  runtime: {
    _type: Type.String,
    _description: "Moteur de thème utilisé par le Studio : 'esm-theme' (actuel) ou 'tokiforge' (quand l'adaptateur framework est disponible).",
    _default: 'esm-theme',
    _validators: [],
  },
  applyPriority: {
    _type: Type.Number,
    _description: "Priorité de l'override global appliqué par le Studio (doit dépasser le thème du tenant).",
    _default: 100,
  },
  requiredPrivilege: {
    _type: Type.String,
    _description: "Privilège requis pour ouvrir le Studio. Chaîne vide = aucune restriction (développement).",
    _default: '',
  },
  storageKey: {
    _type: Type.String,
    _description: 'Préfixe de stockage de la bibliothèque de thèmes.',
    _default: 'egen-theme-studio',
  },
};

export interface StudioConfig {
  runtime: 'esm-theme' | 'tokiforge';
  applyPriority: number;
  requiredPrivilege: string;
  storageKey: string;
}
