import { coreSubpath } from '@egen-civitas/esm-embed-host';
import type { ApprovedGrants, EmbedManifest } from '@egen-civitas/esm-embed-protocol';

/** Une app embarquée publiée par serve-prod dans `<spa>/embed-apps.json` (docs/integration-apps/12). */
export interface EmbedEntry {
  name: string;
  version: string;
  route: string;
  manifest: EmbedManifest;
  /** Plafond approuvé par l'opérateur : les grants effectifs = demandé ∩ approuvé (`effectiveGrants`). */
  approved: ApprovedGrants;
  limits: Record<string, number>;
}

export interface EmbedConfig {
  version: 1;
  apps: EmbedEntry[];
}

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Valide la forme minimale de chaque entrée : le serveur est de confiance, mais un fichier tronqué ne doit pas faire planter la page. */
export function parseEmbedConfig(raw: unknown): EmbedConfig {
  if (!isObj(raw) || raw.version !== 1 || !Array.isArray(raw.apps)) throw new Error('embed-apps.json : format inattendu');
  const apps = raw.apps.filter(
    (a): a is EmbedEntry =>
      isObj(a) && typeof a.name === 'string' && typeof a.route === 'string' && isObj(a.manifest) && typeof (a.manifest as Record<string, unknown>).url === 'string' && isObj(a.manifest.capabilities) && isObj(a.approved),
  );
  return { version: 1, apps: apps.map((a) => ({ ...a, limits: isObj(a.limits) ? (a.limits as Record<string, number>) : {} })) };
}

export async function loadEmbedConfig(spaBase: string, fetchImpl: typeof fetch = fetch): Promise<EmbedConfig> {
  const res = await fetchImpl(`${spaBase.replace(/\/?$/, '/')}embed-apps.json`, { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) throw new Error(`embed-apps.json : HTTP ${res.status}`);
  return parseEmbedConfig(await res.json());
}

/** L'app embarquée dont la route correspond à l'URL courante du Core. */
export function findEntry(config: EmbedConfig, pathname: string, spaBase: string): EmbedEntry | undefined {
  return config.apps.find((a) => coreSubpath(pathname, spaBase, a.route) !== null);
}
