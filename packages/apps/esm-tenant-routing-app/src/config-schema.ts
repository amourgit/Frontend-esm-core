import { Type } from '@egen/esm-framework';

// =============================================================================
//  ESM TENANT ROUTING APP — Schéma de configuration runtime
//  Toutes les valeurs sont surchargables via le système de config EGEN.
//
//  Refonte du 8 août 2026 : tenantSuspendedUrl, validateSubdomainWithBackend,
//  backendValidationEndpoint et unknownTenantBehavior ont été retirés avec
//  la suppression de toute vérification de tenant côté frontend (registry,
//  statut suspendu). Voir @egen/esm-tenant/src/types.ts et
//  docs/analyse-esm-tenant.md pour l'historique de cette décision.
// =============================================================================

export const configSchema = {
  // ── Domaine racine ───────────────────────────────────────────────────────
  rootDomain: {
    _type: Type.String,
    _default: '',
    _description:
      'Domaine racine de la plateforme (ex: "egen.gabon.gov.ga"). ' +
      'Tout hostname qui est exactement ce domaine (sans sous-domaine) est ' +
      "considéré comme l'URL globale sans tenant. " +
      'Laissé vide → repli sur le rootDomain configuré au niveau du système ' +
      'tenant (EGEN_TENANT_ROOT_DOMAIN, voir @egen/esm-tenant setupTenantSystem), ' +
      'puis sur une détection automatique par soustraction du premier segment ' +
      '(imprécise sur les TLD à plusieurs niveaux — à éviter en production).',
  },

  // ── Routes de destination ─────────────────────────────────────────────────
  landingPageUrl: {
    _type: Type.String,
    _default: '${egenSpaBase}/home',
    _description: "URL de la page d'accueil globale (sans tenant). Redirection quand aucun sous-domaine.",
  },

  loginUrl: {
    _type: Type.String,
    _default: '${egenSpaBase}/login',
    _description: 'URL de la page de login. Redirection quand un sous-domaine tenant est présent mais utilisateur non connecté.',
  },

  // ── Comportement ─────────────────────────────────────────────────────────
  skipRoutesRegex: {
    _type: Type.String,
    _default: '^(login|logout|home|change-password)',
    _description: 'Regex des routes exemptées de la garde de routage (pas de redirection sur ces routes).',
  },
};

export interface ConfigSchema {
  rootDomain: string;
  landingPageUrl: string;
  loginUrl: string;
  skipRoutesRegex: string;
}
