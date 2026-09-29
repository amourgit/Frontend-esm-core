// URL de base du backend agent (SSE / transcription / TTS). Renseignée depuis la
// config de l'app (`assistant.agentApiBaseUrl`) par <AssistantExperience/> avant tout appel.
let agentApiBase = '/api/agent';

export function setAgentApiBase(base: string) {
  agentApiBase = (base || '/api/agent').replace(/\/+$/, '');
}

export function agentApiUrl(path: string): string {
  return `${agentApiBase}/${path.replace(/^\/+/, '')}`;
}
