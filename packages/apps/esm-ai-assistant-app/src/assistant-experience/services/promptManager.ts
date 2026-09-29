/**
 * Prompt Manager Module
 * Gère le cycle de vie du Prompt Système de l'Agent IA :
 * 1. Initialisation depuis la variable d'environnement (VITE_AGENT_SYSTEM_PROMPT)
 * 2. Persistance & Synchronisation locale (localStorage)
 * 3. Mise à jour dynamique au fil des interactions et apprentissage de contexte
 */

const STORAGE_KEY_PROMPT = 'egen_agent_system_prompt';
const STORAGE_KEY_META = 'egen_agent_prompt_meta';
const STORAGE_KEY_MEMORIES = 'egen_agent_prompt_memories';

export interface PromptMetadata {
  version: number;
  lastUpdated: string;
  source: 'env' | 'localStorage' | 'dynamic_update' | 'user_custom';
  updateCount: number;
}

export const DEFAULT_BASE_SYSTEM_PROMPT =
  "Tu es l'Assistant IA Intelligent et Stratégique de l'Écosystème Intranet EGEN (CIVITAS Gabon). " +
  "Ton rôle est d'accompagner les directeurs, administrateurs et collaborateurs avec précision, clarté et concision en français. " +
  "Tu es pleinement conscient du contexte de l'organisation CIVITAS Gabon, des directions, des services (GED, RH, Finances, Logistique, Projets) et de la navigation intranet. " +
  "Adapte toujours tes réponses selon le mode actif :\n" +
  "- Mode 1 (Conversation) : Réponses naturelles, directes, cordiales et explications claires.\n" +
  "- Mode 2 (Recherche / Analyse) : Synthèses structurées, extraction de données clés et références précises.\n" +
  "- Mode 3 (Action) : Propositions concrètes, formulaires préremplis, déclenchement d'outils et workflows.\n" +
  "- Mode 4 (Autonome) : Décomposition en sous-objectifs, planification étape par étape et résolution proactive.";

/**
 * Récupère le prompt initial depuis l'environnement ou le fallback par défaut
 */
export function getInitialEnvPrompt(): string {
  try {
    const envPrompt = import.meta.env.VITE_AGENT_SYSTEM_PROMPT;
    if (envPrompt && typeof envPrompt === 'string' && envPrompt.trim().length > 0) {
      return envPrompt.trim();
    }
  } catch {
    // Ignore context without import.meta.env
  }
  return DEFAULT_BASE_SYSTEM_PROMPT;
}

/**
 * Charge le prompt système actif (localStorage en priorité, sinon env)
 */
export function loadSystemPrompt(): string {
  if (typeof window === 'undefined') {
    return getInitialEnvPrompt();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_PROMPT);
    if (stored && stored.trim().length > 0) {
      return stored;
    }
  } catch (err) {
    console.warn('[PromptManager] Erreur lecture localStorage:', err);
  }

  // Premier chargement : initialisation avec l'environnement
  const initial = getInitialEnvPrompt();
  saveSystemPrompt(initial, 'env');
  return initial;
}

/**
 * Enregistre et met à jour le prompt système dans le localStorage
 */
export function saveSystemPrompt(
  prompt: string,
  source: PromptMetadata['source'] = 'dynamic_update'
): void {
  if (typeof window === 'undefined') return;

  try {
    const meta = getPromptMetadata();
    const newMeta: PromptMetadata = {
      version: (meta?.version || 0) + 1,
      lastUpdated: new Date().toISOString(),
      source,
      updateCount: (meta?.updateCount || 0) + 1,
    };

    localStorage.setItem(STORAGE_KEY_PROMPT, prompt);
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(newMeta));

    // Déclenche un événement de synchro locale si plusieurs onglets/composants écoutent
    window.dispatchEvent(
      new CustomEvent('egen_system_prompt_updated', {
        detail: { prompt, meta: newMeta },
      })
    );
  } catch (err) {
    console.error('[PromptManager] Erreur écriture localStorage:', err);
  }
}

/**
 * Récupère les métadonnées de version du prompt
 */
export function getPromptMetadata(): PromptMetadata | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    source: 'env',
    updateCount: 0,
  };
}

/**
 * Ajoute un élément de mémoire ou contexte appris au prompt système
 */
export function appendContextMemory(memoryFact: string): string {
  if (!memoryFact || memoryFact.trim().length === 0) return loadSystemPrompt();

  const currentPrompt = loadSystemPrompt();
  const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const newMemoryLine = `- [${timestamp}] ${memoryFact.trim()}`;

  // Récupération des mémoires existantes
  let memories: string[] = [];
  try {
    const rawMem = localStorage.getItem(STORAGE_KEY_MEMORIES);
    if (rawMem) memories = JSON.parse(rawMem);
  } catch {
    memories = [];
  }

  memories.push(newMemoryLine);
  if (memories.length > 20) {
    memories = memories.slice(memories.length - 20); // Garder les 20 plus récents
  }

  try {
    localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
  } catch {
    // ignore
  }

  // Construit le prompt enrichi avec la section Mémoire Contextuelle
  const memorySectionHeader = '\n\n### Mémoire & Contexte Dynamique Appris en Session :\n';
  const cleanBasePrompt = currentPrompt.split('\n\n### Mémoire & Contexte Dynamique Appris')[0];
  const updatedPrompt = `${cleanBasePrompt}${memorySectionHeader}${memories.join('\n')}`;

  saveSystemPrompt(updatedPrompt, 'dynamic_update');
  return updatedPrompt;
}

/**
 * Réinitialise le prompt système à sa valeur initiale d'environnement
 */
export function resetSystemPrompt(): string {
  const initial = getInitialEnvPrompt();
  try {
    localStorage.removeItem(STORAGE_KEY_MEMORIES);
  } catch {
    // ignore
  }
  saveSystemPrompt(initial, 'env');
  return initial;
}
