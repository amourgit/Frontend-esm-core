import { Type } from '@egen/esm-framework';

// =============================================================================
//  ESM TENANT ROUTING APP — Schéma de configuration runtime
//  Toutes les valeurs sont surchargables via le système de config EGEN.
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
      'Laissé vide → détecté automatiquement en soustrayant le premier segment.',
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
    _description: 'URL de la page de login. Redirection quand tenant résolu mais utilisateur non connecté.',
  },

  tenantDashboardUrl: {
    _type: Type.String,
    _default: '${egenSpaBase}/home',
    _description: 'URL de destination après résolution tenant + authentification réussie.',
  },

  tenantSuspendedUrl: {
    _type: Type.String,
    _default: '${egenSpaBase}/tenant-suspended',
    _description: 'URL de la page de suspension tenant.',
  },

  // ── Comportement ─────────────────────────────────────────────────────────
  validateSubdomainWithBackend: {
    _type: Type.Boolean,
    _default: false,
    _description:
      'Si true, effectue une validation du sous-domaine avec le backend ' +
      '(requête à /api/tenants/{slug}/exists) avant de résoudre le tenant. ' +
      'Si false, la validation se fait uniquement via la registry locale.',
  },

  backendValidationEndpoint: {
    _type: Type.String,
    _default: '${egenBase}/ws/rest/v1/tenant/{slug}/exists',
    _description: "Endpoint backend de validation de l'existence d'un tenant par slug.",
  },

  skipRoutesRegex: {
    _type: Type.String,
    _default: '^(login|logout|home|tenant-suspended|change-password)',
    _description: 'Regex des routes exemptées de la garde de routage (pas de redirection sur ces routes).',
  },

  // ── Gestion erreurs ───────────────────────────────────────────────────────
  unknownTenantBehavior: {
    _type: Type.String,
    _default: 'redirect-to-landing',
    _description:
      'Comportement quand le sous-domaine ne correspond à aucun tenant connu. ' +
      '"redirect-to-landing" (défaut) | "show-error"',
  },
};

export interface ConfigSchema {
  rootDomain: string;
  landingPageUrl: string;
  loginUrl: string;
  tenantDashboardUrl: string;
  tenantSuspendedUrl: string;
  validateSubdomainWithBackend: boolean;
  backendValidationEndpoint: string;
  skipRoutesRegex: string;
  unknownTenantBehavior: 'redirect-to-landing' | 'show-error';
}
