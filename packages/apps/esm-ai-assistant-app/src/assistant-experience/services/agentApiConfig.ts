// URL de base du backend agent (SSE / transcription / TTS). Renseignée depuis la
// config de l'app (`assistant.agentApiBaseUrl`) par <AssistantExperience/> avant tout appel.
//
//  - valeur vide → service agent DÉSACTIVÉ : la conversation passe directement par le
//    transport IA de l'app (backend EGEN ou Gemini direct, voir services/transport.ts) ;
//  - service injoignable (réseau, 404/502/503…, page HTML renvoyée par le serveur de la SPA) →
//    marqué indisponible pendant AGENT_RETRY_AFTER_MS, pour ne pas retenter (et retarder chaque
//    message) à chaque envoi ; la conversation bascule alors sur le transport IA de l'app.
const DEFAULT_AGENT_API_BASE = '/api/agent';
export const AGENT_RETRY_AFTER_MS = 60_000;

let agentApiBase: string | null = DEFAULT_AGENT_API_BASE;
let unavailableUntil = 0;

export function setAgentApiBase(base: string | null | undefined) {
  const trimmed = (base ?? DEFAULT_AGENT_API_BASE).trim();
  const next = trimmed === '' ? null : trimmed.replace(/\/+$/, '');
  if (next !== agentApiBase) unavailableUntil = 0;
  agentApiBase = next;
}

/** Le service agent est-il configuré ET pas récemment constaté injoignable ? */
export function isAgentProxyUsable(now: number = Date.now()): boolean {
  return agentApiBase !== null && now >= unavailableUntil;
}

export function markAgentProxyUnavailable(now: number = Date.now()) {
  unavailableUntil = now + AGENT_RETRY_AFTER_MS;
}

export function agentApiUrl(path: string): string {
  if (agentApiBase === null) {
    throw new Error('Le service agent est désactivé (assistant.agentApiBaseUrl est vide).');
  }
  return `${agentApiBase}/${path.replace(/^\/+/, '')}`;
}

/** @internal Réservé aux tests. */
export function _resetAgentApi() {
  agentApiBase = DEFAULT_AGENT_API_BASE;
  unavailableUntil = 0;
}
