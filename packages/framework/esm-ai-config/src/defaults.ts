// =============================================================================
//  @eigen/esm-ai-config — Valeurs par défaut
//
//  PRIORITÉ DE RÉSOLUTION :
//    1. window.eigenAi* (overrides runtime injectés par le serveur HTML)
//    2. import.meta.env.EIGEN_AI_* (variables de build Vite/Rspack)
//    3. process.env.EIGEN_AI_* (variables Node/CI)
//    4. Ces valeurs par défaut
//
//  AUCUNE valeur ne doit être codée en dur dans le code applicatif.
// =============================================================================

import type { AIConfig } from './types';

/** Lit une variable d'env depuis toutes les sources disponibles */
function readEnv(key: string, fallback: string): string {
  return (
    (typeof window !== 'undefined' && (window as any)[`eigenAi${key.replace(/^EIGEN_AI_/, '').replace(/_([A-Z])/g, (_, l) => l.toUpperCase())}`]) ??
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) ??
    (typeof process !== 'undefined' && process.env?.[key]) ??
    fallback
  );
}

function readEnvBool(key: string, fallback: boolean): boolean {
  const val = readEnv(key, String(fallback));
  return val === 'true' || val === '1';
}

function readEnvNumber(key: string, fallback: number): number {
  const val = readEnv(key, String(fallback));
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

function readEnvArray(key: string, fallback: string[]): string[] {
  const val = readEnv(key, '');
  if (!val) return fallback;
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Construit la configuration par défaut en lisant toutes les sources disponibles.
 * Appelé une seule fois au chargement du module.
 */
export function buildDefaultConfig(): AIConfig {
  return {
    enabled: readEnvBool('EIGEN_AI_ENABLED', false),
    schemaVersion: '1.0.0',

    provider: {
      provider: (readEnv('EIGEN_AI_PROVIDER', 'gemini') as AIConfig['provider']['provider']),
      model: readEnv('EIGEN_AI_MODEL', 'gemini-2.5-pro'),
      temperature: readEnvNumber('EIGEN_AI_TEMPERATURE', 0.7),
      topP: readEnvNumber('EIGEN_AI_TOP_P', 0.95),
      topK: readEnvNumber('EIGEN_AI_TOP_K', 40),
      maxTokens: readEnvNumber('EIGEN_AI_MAX_TOKENS', 8192),
      stream: readEnvBool('EIGEN_AI_STREAM', true),
    },

    backend: {
      baseUrl: readEnv('EIGEN_AI_BACKEND_URL', '${eigenBase}/api/ai'),
      chatEndpoint: readEnv('EIGEN_AI_CHAT_ENDPOINT', '/chat'),
      streamEndpoint: readEnv('EIGEN_AI_STREAM_ENDPOINT', '/chat/stream'),
      requestTimeoutMs: readEnvNumber('EIGEN_AI_REQUEST_TIMEOUT', 30000),
      maxRetries: readEnvNumber('EIGEN_AI_MAX_RETRIES', 3),
      retryDelayMs: readEnvNumber('EIGEN_AI_RETRY_DELAY', 1000),
    },

    context: {
      maxContextSize: readEnvNumber('EIGEN_AI_CONTEXT_MAX_SIZE', 100000),
      includeActiveExtensions: readEnvBool('EIGEN_AI_CONTEXT_EXTENSIONS', true),
      includeNavigation: readEnvBool('EIGEN_AI_CONTEXT_NAVIGATION', true),
      includeModuleConfig: readEnvBool('EIGEN_AI_CONTEXT_CONFIG', false),
      includeFeatureFlags: readEnvBool('EIGEN_AI_CONTEXT_FLAGS', true),
      serializationDepth: readEnvNumber('EIGEN_AI_CONTEXT_DEPTH', 4),
    },

    memory: {
      enabled: readEnvBool('EIGEN_AI_MEMORY_ENABLED', true),
      maxMessages: readEnvNumber('EIGEN_AI_MEMORY_MAX_MESSAGES', 50),
      storageKey: readEnv('EIGEN_AI_MEMORY_KEY', 'eigen:ai:memory'),
      persist: readEnvBool('EIGEN_AI_MEMORY_PERSIST', false),
    },

    security: {
      requiredPrivileges: readEnvArray('EIGEN_AI_REQUIRED_PRIVILEGES', []),
      validateToolsClient: readEnvBool('EIGEN_AI_VALIDATE_TOOLS', true),
      toolTimeoutMs: readEnvNumber('EIGEN_AI_TOOL_TIMEOUT', 30000),
      auditLog: readEnvBool('EIGEN_AI_AUDIT_LOG', false),
    },

    observability: {
      debug: readEnvBool('EIGEN_AI_DEBUG', false),
      eventsEnabled: readEnvBool('EIGEN_AI_EVENTS_ENABLED', true),
      analyticsEnabled: readEnvBool('EIGEN_AI_ANALYTICS_ENABLED', false),
      logLevel: (readEnv('EIGEN_AI_LOG_LEVEL', 'warn') as AIConfig['observability']['logLevel']),
    },
  };
}

export const DEFAULT_AI_CONFIG: AIConfig = buildDefaultConfig();
