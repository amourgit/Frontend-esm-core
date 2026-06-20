// ============================================================================
//  EGEN THEME ENGINE — Chargeur de fichiers JSON par priorité
// ============================================================================

import type { ThemeSchema, LoadedTheme } from './types';

/**
 * Charge un seul fichier JSON de thème depuis une URL.
 * Retourne null si le fetch échoue ou si le JSON est invalide.
 */
async function fetchThemeJson(url: string): Promise<{ url: string; json: ThemeSchema } | null> {
  try {
    // Ajout d'un cache-buster pour le hot-reload (évite le cache navigateur)
    const fetchUrl = url.includes('?') ? url : `${url}?_t=${Date.now()}`;
    const res = await fetch(fetchUrl, {
      headers: { Accept: 'application/json' },
      // Pas de cache pour que le hot-reload fonctionne
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[egen/esm-theme] ⚠️  HTTP ${res.status} pour "${url}" → ignoré`);
      return null;
    }

    const json: ThemeSchema = await res.json();
    return { url, json };
  } catch (err) {
    console.warn(`[egen/esm-theme] ⚠️  Impossible de charger "${url}" →`, err);
    return null;
  }
}

/**
 * Charge tous les fichiers de thème fournis, lit leur clé "priority",
 * et retourne le fichier ayant la priorité la plus élevée.
 *
 * Algorithme :
 * 1. Fetch en parallèle tous les URLs
 * 2. Filtrer les échecs
 * 3. Comparer les clés "priority"
 * 4. Retourner le gagnant (objet complet déjà en mémoire)
 *
 * Note: on charge tous les fichiers en parallèle (performance) puis on compare.
 * Le "gagnant" est déjà parsé — on ne relit pas de fichier.
 */
export async function loadHighestPriorityTheme(themeUrls: string[]): Promise<LoadedTheme | null> {
  if (!themeUrls || themeUrls.length === 0) {
    console.warn('[egen/esm-theme] Aucun URL de thème fourni.');
    return null;
  }

  // Chargement parallèle de tous les fichiers
  const results = await Promise.all(themeUrls.map(fetchThemeJson));

  // Filtrer les échecs
  const valid = results.filter((r): r is { url: string; json: ThemeSchema } => r !== null);

  if (valid.length === 0) {
    console.warn('[egen/esm-theme] Aucun fichier de thème valide chargé.');
    return null;
  }

  // Log des priorités détectées
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.group('[egen/esm-theme] 📂 Fichiers de thème détectés');
    for (const { url, json } of valid) {
      const p = typeof json.priority === 'number' ? json.priority : 'N/A';
      const name = json.meta?.name ?? url;
      // eslint-disable-next-line no-console
      console.log(`  • ${name} (priority = ${p}) — ${url}`);
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  // Trouver le fichier avec la priorité la plus haute
  let winner = valid[0];
  let winnerPriority = typeof winner.json.priority === 'number' ? winner.json.priority : -Infinity;

  for (let i = 1; i < valid.length; i++) {
    const candidate = valid[i];
    const p = typeof candidate.json.priority === 'number' ? candidate.json.priority : -Infinity;

    if (p > winnerPriority) {
      winner = candidate;
      winnerPriority = p;
    } else if (p === winnerPriority && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[egen/esm-theme] ⚠️  Égalité de priorité (${p}) entre "${winner.url}" et "${candidate.url}". Le premier est retenu.`,
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const name = winner.json.meta?.name ?? winner.url;
    // eslint-disable-next-line no-console
    console.log(`[egen/esm-theme] 🏆 Thème retenu : "${name}" (priority = ${winnerPriority})`);
  }

  return {
    url: winner.url,
    priority: winnerPriority,
    schema: winner.json,
  };
}
