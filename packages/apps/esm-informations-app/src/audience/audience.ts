// =============================================================================
//  Audiences — à qui s'adresse une information
//    interne  : collaborateurs (intranet, espace authentifié)
//    extranet : partenaires, prestataires, institutions (accès externe contrôlé)
//    public   : grand public (sans authentification)
// =============================================================================

export type Audience = 'interne' | 'extranet' | 'public';
export type AudienceFilter = 'all' | Audience;

export const AUDIENCE_ORDER: Audience[] = ['interne', 'extranet', 'public'];

/** Audience appliquée quand un contenu n'en déclare aucune. */
export const DEFAULT_AUDIENCE: Audience = 'interne';

export function resolveAudience(audience?: Audience): Audience {
  return audience ?? DEFAULT_AUDIENCE;
}

export function matchesAudience(item: { audience?: Audience }, filter: AudienceFilter): boolean {
  return filter === 'all' || resolveAudience(item.audience) === filter;
}

export function isAudienceFilter(value: unknown): value is AudienceFilter {
  return value === 'all' || value === 'interne' || value === 'extranet' || value === 'public';
}
