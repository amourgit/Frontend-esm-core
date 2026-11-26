import { useContext } from 'react';
import { ComponentContext, getExtensionRegistration } from '@egen-civitas/esm-framework';

/**
 * Contexte d'une extension générique : le composant retrouve SA PROPRE enregistrement d'extension (via `ComponentContext`),
 * dont la `meta.embed` — écrite par serve-prod — désigne l'app et la contribution. Rien n'est deviné d'après l'URL.
 */
export function useEmbedExtensionMeta(): { app?: string; ext?: string; meta: Record<string, unknown> } {
  const ctx = useContext(ComponentContext);
  const meta = (ctx.extension ? getExtensionRegistration(ctx.extension.extensionId)?.meta : undefined) as Record<string, unknown> | undefined;
  const embed = meta?.embed as { app?: string; ext?: string } | undefined;
  return { app: embed?.app, ext: embed?.ext, meta: meta ?? {} };
}
