import { Type } from '@egen-civitas/esm-framework';

// =============================================================================
//  ESM SPACES & SITES APP — Configuration runtime
//
//  Ce que l'entreprise qui déploie la solution renseigne : ses Espaces et ses sites. Les apps peuvent aussi déclarer leurs
//  propres sites (extensions du slot `sites-registry-slot`, voir README) : les deux sources s'ajoutent.
// =============================================================================

export const configSchema = {
  spaces: {
    _type: Type.Array,
    _elements: {
      id: { _type: Type.String, _description: "Identifiant stable de l'Espace (référencé par `meta.workspaces` des entrées de navigation)." },
      name: { _type: Type.String, _description: "Nom affiché de l'Espace." },
      subtitle: { _type: Type.String, _default: '', _description: "Précision affichée avec l'Espace (facultatif)." },
    },
    _default: [
      { id: 'intranet', name: 'Intranet', subtitle: "Portail interne, communauté et vie d'organisation" },
      { id: 'extranet', name: 'Extranet', subtitle: 'Collaboration avec partenaires externes, filiales et prestataires' },
      { id: 'public', name: 'Espace Public', subtitle: "Diffusion d'informations publiques, décrets et transparence" },
      { id: 'personnel', name: 'Espace Personnel', subtitle: 'Coffre-fort numérique individuel, documents privés et réglages' },
    ],
    _description: "Les Espaces proposés (intranet, extranet…). Liste ouverte : ajoutez, retirez ou renommez librement.",
  },
  defaultSpaceId: {
    _type: Type.String,
    _default: 'intranet',
    _description: "Espace actif au premier chargement. S'il n'existe pas dans `spaces`, le premier est utilisé.",
  },
  sites: {
    items: {
      _type: Type.Array,
      _elements: {
        id: { _type: Type.String, _description: 'Identifiant stable du site.' },
        parentId: { _type: Type.String, _default: '', _description: 'Identifiant du site parent ; vide : site racine. La profondeur est illimitée.' },
        name: { _type: Type.String, _description: 'Nom affiché du site.' },
        shortName: { _type: Type.String, _default: '', _description: 'Sigle ou nom court (facultatif).' },
        category: { _type: Type.String, _default: '', _description: 'Catégorie : regroupe les sites d’un même parent dans la liste (facultatif).' },
        description: { _type: Type.String, _default: '', _description: 'Description (facultatif).' },
        order: { _type: Type.Number, _default: 0, _description: 'Ordre parmi les sites du même parent ; à égalité, par nom.' },
      },
      _default: [],
      _description: "Sites déclarés par le déploiement, À PLAT (chacun référence son parent par `parentId`). S'ajoutent à ceux que les apps déclarent.",
    },
    route: {
      _type: Type.String,
      _default: '${egenSpaBase}/sites/{siteId}/applications',
      _description:
        "Destination quand on choisit un site ({siteId} est remplacé par son identifiant ; accepte ${egenSpaBase}). Sert aussi à reconnaître le site actif depuis l'URL. Vide : le choix ne navigue pas.",
    },
    listRoute: {
      _type: Type.String,
      _default: '${egenSpaBase}/sites',
      _description: 'Destination quand on revient à « tous les sites » depuis le premier niveau. Vide : pas de navigation.',
    },
  },
  selectors: {
    showSpaces: { _type: Type.Boolean, _default: true, _description: "Affiche le sélecteur d'Espace dans la TopBar." },
    showSites: { _type: Type.Boolean, _default: true, _description: 'Affiche la cascade de sélecteurs de sites dans la TopBar.' },
  },
};

export interface SpaceConfig {
  id: string;
  name: string;
  subtitle: string;
}

export interface SiteConfig {
  id: string;
  parentId: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  order: number;
}

export interface ConfigSchema {
  spaces: SpaceConfig[];
  defaultSpaceId: string;
  sites: { items: SiteConfig[]; route: string; listRoute: string };
  selectors: { showSpaces: boolean; showSites: boolean };
}
