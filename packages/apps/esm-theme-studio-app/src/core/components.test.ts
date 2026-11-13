import { describe, expect, it } from 'vitest';
import { cascadeChain, COMPONENTS, componentPath, componentVar, cssVarName, fallbackFor, getComponent, resolveComponentToken, STATES } from './components';

describe('registre de composants', () => {
  it('chaque composant a des variantes, états et propriétés valides', () => {
    for (const c of COMPONENTS) {
      expect(c.variants.length).toBeGreaterThan(0);
      expect(c.props.length).toBeGreaterThan(0);
      c.states.forEach((s) => expect(STATES).toContain(s));
      expect(c.states).toContain('default');
    }
    expect(new Set(COMPONENTS.map((c) => c.id)).size).toBe(COMPONENTS.length);
  });

  it('Button expose les 8 variantes du cahier des charges', () => {
    expect(getComponent('button')!.variants).toEqual(['primary', 'secondary', 'destructive', 'success', 'warning', 'outline', 'ghost', 'transparent']);
  });
});

describe('variables CSS', () => {
  it('suit la convention de `flatten` (camelCase → kebab)', () => {
    expect(cssVarName(componentPath('button', 'primary', 'hover', 'borderColor'))).toBe('--components-button-primary-hover-border-color');
  });

  it('cascade : état → default → base/état → base/default → repli', () => {
    expect(cascadeChain('button', 'primary', 'hover', 'radius').map((p) => p.slice(2, 4).join('.'))).toEqual(['primary.hover', 'primary.default', 'base.hover', 'base.default']);
    expect(cascadeChain('card', 'base', 'default', 'radius')).toHaveLength(1);
  });

  it('componentVar imbrique les var() du plus spécifique au repli', () => {
    const v = componentVar('button', 'primary', 'hover', 'radius');
    expect(v.startsWith('var(--components-button-primary-hover-radius, var(--components-button-primary-default-radius,')).toBe(true);
    expect(v.endsWith('var(--border-radius-md)))))')).toBe(true);
  });

  it('les repli par variante surchargent ceux du composant', () => {
    expect(fallbackFor('button', 'destructive', 'background')).toBe('var(--colors-error-600)');
    expect(fallbackFor('button', 'primary', 'background')).toBe('var(--colors-primary-500)');
  });
});

describe('resolveComponentToken', () => {
  const doc = {
    components: {
      button: {
        base: { default: { radius: '2px' } },
        primary: { default: { background: { light: '#111111', dark: '#eeeeee' } }, hover: { background: '#222222' } },
      },
    },
  };

  it('prend la valeur la plus spécifique et sait d’où elle vient', () => {
    expect(resolveComponentToken(doc, 'light', 'button', 'primary', 'hover', 'background')).toEqual({ value: '#222222', source: ['components', 'button', 'primary', 'hover', 'background'] });
  });

  it('retombe sur default de la variante, en respectant light/dark', () => {
    expect(resolveComponentToken(doc, 'dark', 'button', 'primary', 'focus', 'background').value).toBe('#eeeeee');
  });

  it('retombe sur base puis sur le token global', () => {
    expect(resolveComponentToken(doc, 'light', 'button', 'ghost', 'hover', 'radius').value).toBe('2px');
    const r = resolveComponentToken({}, 'light', 'button', 'ghost', 'hover', 'radius');
    expect(r).toEqual({ value: 'var(--border-radius-md)', source: null });
  });
});
