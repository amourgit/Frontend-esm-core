import { mergeDeep } from './path';
import { fromTweakcn, parseTweakcnCss, parseTweakcnRegistry } from './tweakcn-adapter';
import { sanitizeImported, unwrapThemeEnvelope, validateTheme, type ImportOutcome } from './validation';
import type { ThemeDoc } from './types';

export const EXPORT_FORMAT_VERSION = 1;

/**
 * Importe du texte (fichier `.json` ou `.css`) vers un thème EGEN valide.
 * Formats : JSON EGEN (y compris produit par un générateur/IA), registry TweakCN, CSS TweakCN/shadcn.
 * `base` : thème sur lequel un thème TweakCN partiel est appliqué (sinon il est importé seul).
 */
export function importThemeText(text: string, base: ThemeDoc = {}): ImportOutcome {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, format: 'unknown', issues: [{ severity: 'error', path: '', message: 'Fichier vide.' }] };

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let json: unknown;
    try {
      json = sanitizeImported(JSON.parse(trimmed));
    } catch (e) {
      return { ok: false, format: 'unknown', issues: [{ severity: 'error', path: '', message: `JSON invalide : ${(e as Error).message}` }] };
    }
    const registry = parseTweakcnRegistry(json);
    if (registry) return finish('tweakcn-registry', mergeDeep(base, fromTweakcn(registry)));
    return finish('egen', unwrapThemeEnvelope(json) as ThemeDoc);
  }

  const css = parseTweakcnCss(trimmed);
  if (css) return finish('tweakcn-css', mergeDeep(base, fromTweakcn(css)));
  return { ok: false, format: 'unknown', issues: [{ severity: 'error', path: '', message: 'Format non reconnu (JSON EGEN, registry TweakCN ou CSS attendu).' }] };
}

function finish(format: ImportOutcome['format'], doc: ThemeDoc): ImportOutcome {
  const { valid, issues } = validateTheme(doc);
  return { ok: valid, format, doc: valid ? doc : undefined, issues };
}

/** Export JSON complet du thème EGEN (aucun appauvrissement : tout le document est conservé). */
export function exportThemeJson(doc: ThemeDoc, meta: { name?: string; author?: string } = {}): string {
  const prev = (doc.meta && typeof doc.meta === 'object' ? doc.meta : {}) as Record<string, unknown>;
  const out = { ...doc, meta: { ...prev, ...(meta.name ? { name: meta.name } : {}), ...(meta.author ? { author: meta.author } : {}), updatedAt: new Date().toISOString(), studioFormat: EXPORT_FORMAT_VERSION } };
  return `${JSON.stringify(out, null, 2)}\n`;
}

export const themeFileName = (name: string): string => `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme'}.theme.json`;
