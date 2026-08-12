// =============================================================================
//  @egen-civitas/esm-ai-assistant-app — Persistance de la mémoire de conversation
//
//  @egen-civitas/esm-ai-config déclare AIMemoryConfig (enabled/maxMessages/storageKey/
//  persist) mais aucune couche ne lisait ni n'écrivait jusqu'ici dans ce
//  storage. C'est le rôle de cette app (Couche 2, consommatrice) de le faire —
//  la Couche 1 ne fait qu'exposer la configuration, pas l'implémentation.
// =============================================================================

import { getAIConfig } from '@egen-civitas/esm-ai-framework';
import type { AssistantMessage } from '../hooks/use-ai-chat';

export function loadPersistedMessages(): AssistantMessage[] {
  const { memory } = getAIConfig();
  if (!memory.enabled || !memory.persist) return [];

  try {
    const raw = localStorage.getItem(memory.storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssistantMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-memory.maxMessages);
  } catch {
    return [];
  }
}

export function persistMessages(messages: AssistantMessage[]): void {
  const { memory } = getAIConfig();
  if (!memory.enabled || !memory.persist) return;

  try {
    const trimmed = messages.slice(-memory.maxMessages);
    localStorage.setItem(memory.storageKey, JSON.stringify(trimmed));
  } catch {
    // Quota dépassé ou localStorage indisponible — dégradation silencieuse,
    // la conversation reste fonctionnelle en mémoire vive pour la session.
  }
}

export function clearPersistedMessages(): void {
  const { memory } = getAIConfig();
  try {
    localStorage.removeItem(memory.storageKey);
  } catch {
    // no-op
  }
}
