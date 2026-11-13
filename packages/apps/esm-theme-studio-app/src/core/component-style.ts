import { COMPONENTS, componentVar, getComponent, type ComponentState } from './components';

/** Propriété du registre → propriété CSS (la vitrine et tout futur rendu de composant partagent ce mapping). */
const CSS_PROP: Record<string, string[]> = {
  background: ['background'],
  foreground: ['color'],
  borderColor: ['borderColor'],
  borderWidth: ['borderWidth'],
  radius: ['borderRadius'],
  shadow: ['boxShadow'],
  fontWeight: ['fontWeight'],
  height: ['height'],
  width: ['width'],
  size: ['width', 'height'],
  headerBackground: [],
  overlay: [],
};

export type StyleMap = Record<string, string>;

/** Style CSS (expressions `var(--components-…, …)` en cascade) d'un composant pour une variante et un état donnés. */
export function componentStyle(component: string, variant: string, state: ComponentState | string = 'default'): StyleMap {
  const spec = getComponent(component);
  if (!spec) return {};
  const style: StyleMap = { borderStyle: 'solid', transition: 'var(--transitions-default, all 200ms ease)' };
  for (const prop of spec.props) {
    const value = componentVar(component, variant, state, prop.id);
    if (prop.id === 'paddingX' || prop.id === 'paddingY') {
      style.padding = `${componentVar(component, variant, state, 'paddingY')} ${componentVar(component, variant, state, 'paddingX')}`;
    } else for (const css of CSS_PROP[prop.id] ?? []) style[css] = value;
  }
  if (state === 'disabled') style.opacity = '0.5';
  return style;
}

export const componentIds = (): string[] => COMPONENTS.map((c) => c.id);
