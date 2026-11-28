import { describe, expect, it } from 'vitest';
import { ThemeStylesRuntime, defaultThemeStyles } from '@egen-civitas/esm-theme';
import { flattenTokens, themeDocument } from './local-theme';

const overrideId = themeDocument.meta?.name ?? 'local-theme';

describe('local theme override', () => {
  it('émet les variables sur :root et .dark sans erreur de validation', () => {
    const runtime = new ThemeStylesRuntime();
    runtime.apply(defaultThemeStyles, 'light');

    const rootTokens = flattenTokens(themeDocument.tokens);
    // Ne doit pas lever : toutes les valeurs passent la grammaire de sécurité.
    runtime.setOverride(overrideId, {
      light: { ...themeDocument.light, ...rootTokens },
      dark: themeDocument.dark,
    });

    const el = document.head.querySelector(`style[data-egen-override="${overrideId}"]`);
    expect(el).not.toBeNull();
    const css = el!.textContent ?? '';
    expect(css).toContain('--background: #f5f1e6');
    expect(css).toContain('--primary: #a67c52');
    expect(css).toContain('--palette-primary-600: oklch(0.55 0.078 65.544)');
    expect(css).toContain('--z-index-modal: 400');
    // dark section
    expect(css).toContain('.dark');
  });
});
