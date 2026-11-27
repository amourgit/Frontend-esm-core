// Configuration runtime des apps (fichier JSON servi au navigateur, lu au DÉMARRAGE du Core).
//
// Le Shell charge les `configUrls` et fusionne chaque fichier : un objet dont chaque clé est le `name`
// d'une app (`moduleName`) et chaque valeur sa configuration, ex. :
//   { "@civitas/esm-hello-app": { "apiUrl": "https://design.exemple.org" } }
// Sans fichier, le Shell n'a aucune source de configuration en production : les apps externes configurables
// (apps Module Federation) n'auraient que leurs valeurs par défaut.
//
// Intégration À FROID : le fichier est lu et validé une fois au démarrage ; une erreur EMPÊCHE le démarrage
// (message explicite) au lieu de servir en silence des valeurs par défaut — le Shell, lui, ignore un fichier
// illisible et continuerait sans le dire. Le contenu est PUBLIC (servi au navigateur) : aucun secret.
import { readFileSync } from 'node:fs';

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

export class RuntimeConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RuntimeConfigError';
  }
}

/** Valide le contenu déjà parsé ; renvoie l'objet ou lève `RuntimeConfigError`. */
export function validateRuntimeConfig(value, source = 'configuration') {
  if (!isPlainObject(value)) {
    throw new RuntimeConfigError(`${source} : un objet JSON est attendu (clés = noms d'apps).`);
  }
  for (const [name, conf] of Object.entries(value)) {
    if (!name.trim()) throw new RuntimeConfigError(`${source} : nom d'app vide.`);
    if (!isPlainObject(conf)) {
      throw new RuntimeConfigError(`${source} : la configuration de « ${name} » doit être un objet.`);
    }
  }
  return value;
}

/** Lit et valide le fichier ; renvoie `{ config, json }` (json = corps servi au navigateur). */
export function loadRuntimeConfig(file) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    throw new RuntimeConfigError(`EGEN_CONFIG_FILE illisible (${file}) : ${e.code ?? e.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new RuntimeConfigError(`EGEN_CONFIG_FILE n'est pas du JSON valide (${file}) : ${e.message}`);
  }
  const config = validateRuntimeConfig(parsed, `EGEN_CONFIG_FILE (${file})`);
  return { config, json: JSON.stringify(config) };
}

/** URLs de configuration à donner au Shell : fichier local (si présent) puis URLs supplémentaires. */
export function buildConfigUrls({ spa, hasFile, extra = '' }) {
  const extras = String(extra)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...(hasFile ? [`${spa}/config.json`] : []), ...extras];
}
