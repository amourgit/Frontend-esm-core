import type { SocialLinkItem } from './social-links.component';

// Aucun lien par défaut : la version d'origine (ClipPathLinks) pointait vers les comptes personnels d'un
// tiers, sans rapport avec CIVITAS (voir social-links.component.tsx). À renseigner avec les vrais liens CIVITAS.
export const socialLinkRows: SocialLinkItem[][] = [];
