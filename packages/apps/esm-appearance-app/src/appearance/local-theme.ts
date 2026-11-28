import { ThemeStylesRuntime } from '@egen-civitas/esm-theme';
import theme from './local-theme.json';

export const themeDocument = theme;

// Prévisualisation locale d'un thème (document new-theme.json déposé ici tel quel).
// Le service de thèmes backend n'est pas encore branché : les variables sont injectées en
// surcouche (`:root` pour light + tokens, `.dark` pour dark) jusqu'à ce que `GET /api/theme`
// serve ce thème. À retirer quand le backend le prend en charge.
//
// Instance dédiée et NON le singleton `getTheme()` : le partage MF d'esm-theme est asynchrone
// (`eager: false`) et n'est pas garanti prêt à l'évaluation de ce module. `setOverride` ne fait
// qu'écrire un <style data-egen-override> dans <head> — il n'a pas besoin du runtime du shell.

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

// tokens.<groupe>.<chemin> → --<groupe>-<chemin> (kebab-case), convention du document.
export function flattenTokens(node: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      const path = prefix ? `${prefix}-${kebab(k)}` : kebab(k);
      if (v && typeof v === 'object') flattenTokens(v, path, out);
      else out[path] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
    }
  }
  return out;
}

// L'id de surcharge suit le nom déclaré dans le document (`meta.name`), sans nom en dur :
// n'importe quel thème déposé dans local-theme.json est prévisualisé tel quel.
const overrideId = theme.meta?.name ?? 'local-theme';

// Independants du mode : posés sur :root, ils valent aussi en .dark.
const rootTokens = flattenTokens(theme.tokens);

// Le partage MF d'esm-theme est asynchrone (`eager: false`) : à l'évaluation de ce module,
// `ThemeStylesRuntime` peut ne pas encore être résolu. On retente jusqu'à ce que le share
// soit prêt — `setOverride` est idempotent (même id = remplacement), rejouer est sans risque.
let attempts = 0;

export function applyLocalTheme(): void {
  try {
    new ThemeStylesRuntime().setOverride(overrideId, {
      light: { ...theme.light, ...rootTokens },
      dark: theme.dark,
    });
  } catch {
    if (attempts++ < 40) setTimeout(applyLocalTheme, 250);
    // au-delà : valeurs refusées par la grammaire de sécurité ou DOM absent — sans effet.
  }
}
