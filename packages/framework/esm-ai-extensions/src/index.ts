// =============================================================================
//  @eigen/esm-ai-extensions — API d'extension pour les microfrontends
//
//  Re-exporte les primitives d'extension depuis les packages spécialisés
//  et fournit des helpers de haut niveau pour un usage simplifié.
//
//  Usage dans une app microfrontend :
//
//  ```ts
//  import { defineAIModule } from '@eigen/esm-ai-extensions';
//
//  export function startupApp() {
//    defineAIModule({
//      moduleName: '@school/esm-grades-app',
//      tools: [
//        {
//          id: 'generate_report',
//          name: 'Générer un bulletin',
//          description: 'Génère le bulletin d\'un étudiant pour une période donnée.',
//          parameters: {
//            studentUuid: { type: 'string', required: true, description: 'UUID de l\'étudiant' },
//            period: { type: 'string', required: true, description: 'Période (ex: "S1-2025")' },
//          },
//          execute: async (ctx) => {
//            // Appeler l'API EIGEN
//            const resp = await openmrsFetch(`/api/reports/${ctx.args.studentUuid}?period=${ctx.args.period}`);
//            return { success: true, data: await resp.json(), durationMs: 0 };
//          },
//        },
//      ],
//      contextProviders: [
//        {
//          id: 'grades-app:active-student',
//          name: 'Étudiant sélectionné',
//          priority: 10,
//          provide: () => ({ activeStudent: activeStudentStore.getState().student }),
//          subscribe: (cb) => activeStudentStore.subscribe(cb),
//        },
//      ],
//      capabilities: [
//        {
//          id: 'view-grades',
//          name: 'Consulter les notes',
//          description: 'Permet à l\'IA de consulter et résumer les notes d\'un étudiant.',
//        },
//      ],
//    });
//  }
//  ```
// =============================================================================

export {
  registerTool,
  overrideTool,
  decorateTool,
  removeTool,
  registerCapability,
  removeCapability,
  type AIToolDefinition,
  type AICapability,
  type AIToolDecorator,
  type AIToolResult,
  type AIToolExecutionContext,
} from '@eigen/esm-ai-tools';

export {
  registerAIContextProvider,
  removeAIContextProvider,
  type AIContextProvider,
} from '@eigen/esm-ai-context';

export {
  overrideAIConfig,
  subscribeToAIConfig,
  type PartialAIConfig,
} from '@eigen/esm-ai-config';

export {
  subscribeToAIEvent,
  observeAIEvent,
  AI_EVENTS,
  type AIEventName,
} from '@eigen/esm-ai-events';

// ─── defineAIModule — API de haut niveau ──────────────────────────────────────

import {
  registerTool,
  overrideTool,
  registerCapability,
  type AIToolDefinition,
  type AICapability,
} from '@eigen/esm-ai-tools';

import {
  registerAIContextProvider,
  type AIContextProvider,
} from '@eigen/esm-ai-context';

export interface AIModuleDefinition {
  /** Nom du module microfrontend (ex: '@school/esm-grades-app') */
  moduleName: string;
  /** Tools à enregistrer */
  tools?: AIToolDefinition[];
  /** Tools qui remplacent des tools existants */
  toolOverrides?: AIToolDefinition[];
  /** Context providers */
  contextProviders?: AIContextProvider[];
  /** Capacités déclaratives */
  capabilities?: AICapability[];
}

/**
 * Enregistre tous les assets IA d'un module microfrontend en une seule appel.
 * Retourne une fonction de nettoyage à appeler lors du démontage.
 *
 * @example
 * ```ts
 * // Dans startupApp() d'une microfrontend :
 * const cleanup = defineAIModule({ moduleName: '...', tools: [...] });
 * // Dans le lifecycle 'unmount' si nécessaire :
 * cleanup();
 * ```
 */
export function defineAIModule(def: AIModuleDefinition): () => void {
  const cleanupFns: Array<() => void> = [];

  // Enregistrer les tools
  for (const tool of def.tools ?? []) {
    registerTool({ ...tool, moduleName: tool.moduleName ?? def.moduleName });
    cleanupFns.push(() => {
      try {
        const { removeTool } = require('@eigen/esm-ai-tools');
        removeTool(tool.id);
      } catch {}
    });
  }

  // Appliquer les overrides
  for (const tool of def.toolOverrides ?? []) {
    overrideTool({ ...tool, moduleName: tool.moduleName ?? def.moduleName });
  }

  // Enregistrer les context providers
  for (const provider of def.contextProviders ?? []) {
    const unsub = registerAIContextProvider(provider);
    cleanupFns.push(unsub);
  }

  // Enregistrer les capacités
  for (const cap of def.capabilities ?? []) {
    registerCapability(cap);
    cleanupFns.push(() => {
      try {
        const { removeCapability } = require('@eigen/esm-ai-tools');
        removeCapability(cap.id);
      } catch {}
    });
  }

  return () => cleanupFns.forEach((fn) => fn());
}
