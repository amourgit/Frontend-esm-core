import { describe, expect, it } from 'vitest';
import { CARBON_BRIDGE } from './carbon-bridge.generated';
import { carbonScopeVars, previewStyle } from './carbon-scope';

describe('pont Carbon scopé', () => {
  it('reprend les variables du pont du framework (EGEN → Carbon)', () => {
    expect(Object.keys(CARBON_BRIDGE).length).toBeGreaterThan(100);
    expect(Object.keys(CARBON_BRIDGE).every((k) => k.startsWith('--cds-'))).toBe(true);
    expect(CARBON_BRIDGE['--cds-text-primary']).toContain('var(--colors-surface-foreground');
    expect(CARBON_BRIDGE['--cds-layer']).toContain('var(--panel-card-background');
  });
  it('previewStyle fusionne thème édité + pont, sans écraser le thème', () => {
    const s = previewStyle({ '--colors-primary-500': '#f00' });
    expect(s['--colors-primary-500']).toBe('#f00');
    expect(s['--cds-background']).toBeDefined();
    expect(carbonScopeVars()).not.toBe(CARBON_BRIDGE); // copie
  });
});
