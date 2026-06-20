// ============================================================================
//  EGEN THEME ENGINE — Injection CSS dans le DOM
// ============================================================================

const STYLE_TAG_ID = 'egen-theme-vars';

/**
 * Injecte les variables CSS dans le DOM via une balise <style> dédiée.
 *
 * Stratégie choisie : balise <style> dans <head> (au lieu de element.style.setProperty)
 * → Avantages :
 *   - Fonctionne avec les pseudo-sélecteurs (:root, [data-theme="dark"], etc.)
 *   - Visible dans les DevTools → onglet Styles
 *   - Pas de conflit avec les styles inline des composants
 *   - Mise à jour atomique (un seul reflow)
 *
 * La balise est créée une seule fois, puis son contenu est remplacé à chaque update.
 */
export function injectCssVarsToDocument(cssVarsMap: Record<string, string>, targetSelector = ':root'): void {
  if (typeof document === 'undefined') return; // SSR guard

  const lines = Object.entries(cssVarsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  ${name}: ${value};`);

  const cssText = `${targetSelector} {\n${lines.join('\n')}\n}`;

  let styleTag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = STYLE_TAG_ID;
    styleTag.setAttribute('data-egen', 'theme');
    // Insérer en premier dans <head> pour que les styles app puissent surcharger
    const firstChild = document.head.firstChild;
    document.head.insertBefore(styleTag, firstChild);
  }

  styleTag.textContent = cssText;
}

/**
 * Supprime les variables CSS du DOM (utile pour le cleanup / tests).
 */
export function removeCssVarsFromDocument(): void {
  if (typeof document === 'undefined') return;
  const styleTag = document.getElementById(STYLE_TAG_ID);
  styleTag?.remove();
}

/**
 * Génère un bloc CSS :root { ... } en string — utile pour export statique.
 */
export function buildCssString(cssVarsMap: Record<string, string>, selector = ':root'): string {
  const lines = Object.entries(cssVarsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  ${name}: ${value};`);

  return `${selector} {\n${lines.join('\n')}\n}\n`;
}
