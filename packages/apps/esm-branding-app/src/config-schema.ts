import { Type, validators } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM BRANDING APP — Identité de l'entreprise (configuration runtime)
//
//  Ce que l'entreprise qui déploie la solution renseigne pour la personnaliser. À ne pas confondre avec les
//  préférences de l'utilisateur (langue, thème…). Cette app injecte ses éléments dans la TopBar par des extensions :
//  la TopBar ne contient ni logo ni nom d'entreprise.
//
//  Changer ces valeurs (config du déploiement ou éditeur de config des implementer tools) met le logo à jour À CHAUD,
//  sans recharger la page et sans toucher au code de la TopBar.
// =============================================================================

export const configSchema = {
  organization: {
    name: {
      _type: Type.String,
      _default: 'EGEN',
      _description: "Nom de l'entreprise ou de l'organisation qui déploie la solution (infobulle et texte alternatif du logo).",
    },
    description: {
      _type: Type.String,
      _default: 'Écosystème Gouvernemental de l’Économie Numérique',
      _description: 'Description courte (slogan), affichée à la suite du nom dans l’infobulle du logo. Vide : le nom seul.',
    },
  },
  logo: {
    src: {
      _type: Type.String,
      _default: '',
      _description:
        "Logo : chemin, URL absolue ou data:. Vide : logo EGEN fourni avec la solution. Fournir un PNG/SVG à fond transparent.",
    },
    alt: {
      _type: Type.String,
      _default: '',
      _description: "Texte alternatif du logo. Vide : le nom de l'organisation suivi de sa description.",
    },
    link: {
      _type: Type.String,
      _default: '${egenSpaBase}/home',
      _description: 'Destination du clic sur le logo (accepte ${egenSpaBase}). Vide : logo non cliquable.',
    },
    height: {
      _type: Type.Number,
      _default: 44,
      _description: 'Hauteur du logo en pixels dès 640 px de large ; la largeur suit (le rapport du logo est conservé).',
      _validators: [validators.inRange(16, 96)],
    },
    compactHeight: {
      _type: Type.Number,
      _default: 36,
      _description: 'Hauteur du logo en pixels sur les écrans de moins de 640 px de large.',
      _validators: [validators.inRange(16, 96)],
    },
  },
};

export interface ConfigSchema {
  organization: { name: string; description: string };
  logo: { src: string; alt: string; link: string; height: number; compactHeight: number };
}
