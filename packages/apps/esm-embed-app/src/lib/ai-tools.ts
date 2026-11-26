import type { AIToolDefinition, AIToolParam } from '@egen-civitas/esm-framework';
import type { AiToolDescriptor } from './providers';

const TYPES = new Set(['string', 'number', 'boolean', 'object', 'array']);
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

/** Identifiant stable et non collisionnant d'un outil d'app embarquée dans le registre du Core. */
export const embedToolId = (moduleName: string, name: string) => `embed.${slug(moduleName)}.${name}`;

/** JSON Schema simple (`properties` + `required`) → paramètres d'outil du Core. Types inconnus → `object` (jamais de champ libre non typé). */
export function toToolParams(schema: Record<string, unknown> | undefined): Record<string, AIToolParam> {
  const props = schema && typeof schema.properties === 'object' && schema.properties !== null ? (schema.properties as Record<string, Record<string, unknown>>) : {};
  const required = Array.isArray(schema?.required) ? (schema!.required as unknown[]) : [];
  const out: Record<string, AIToolParam> = {};
  for (const [key, p] of Object.entries(props)) {
    if (!p || typeof p !== 'object') continue;
    const type = typeof p.type === 'string' && TYPES.has(p.type) ? (p.type as AIToolParam['type']) : 'object';
    out[key] = {
      type,
      description: typeof p.description === 'string' ? p.description.slice(0, 500) : key,
      ...(required.includes(key) ? { required: true } : {}),
      ...(Array.isArray(p.enum) ? { enum: p.enum.slice(0, 50) } : {}),
    };
  }
  return out;
}

/**
 * Définition d'outil du Core pour un outil d'app embarquée. L'exécution traverse le canal de l'hôte (`invoke`) ;
 * le frontend n'a aucune autorité propre : le backend IA appelle, valide les arguments et décide.
 */
export function toToolDefinition(moduleName: string, tool: AiToolDescriptor, invoke: (name: string, args: Record<string, unknown>) => Promise<unknown>): AIToolDefinition {
  return {
    id: embedToolId(moduleName, tool.name),
    name: tool.name,
    description: tool.description.slice(0, 1000),
    parameters: toToolParams(tool.inputSchema),
    moduleName,
    metadata: { source: 'embedded-app' },
    async execute(ctx) {
      const t0 = Date.now();
      try {
        return { success: true, data: await invoke(tool.name, ctx.args), durationMs: Date.now() - t0 };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Échec de l\'outil', durationMs: Date.now() - t0 };
      }
    },
  };
}
