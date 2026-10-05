import { getAIConfig } from '@egen-civitas/esm-ai-framework';
import * as backendTransport from './ai-backend-client';
import * as directTransport from './gemini-direct-client';

// =============================================================================
//  Sélection du transport IA (partagée par le chat historique ET l'expérience
//  plein écran).
//
//   - directMode ou apiKey renseignés → Gemini appelé directement depuis le
//     navigateur (développement uniquement, voir gemini-direct-client.ts) ;
//   - sinon → backend proxy (EGEN_AI_BACKEND_URL), chemin recommandé en production.
//
//  Résolu à CHAQUE appel (pas une fois au chargement du module) pour rester
//  cohérent avec un changement de config à chaud (ex. tests, multi-tenant).
// =============================================================================

export function resolveTransport() {
  const { provider } = getAIConfig();
  return provider.directMode || provider.apiKey ? directTransport : backendTransport;
}
