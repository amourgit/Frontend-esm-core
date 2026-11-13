import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectItem, Slider, Tag, TextInput, Toggle } from '@carbon/react';
import { generateScale, SCALE_STEPS, toHex, contrastRatio, wcagLevel } from '../core/color';
import type { ControlDef } from '../core/catalog';
import styles from './studio.scss';

export interface ControlProps {
  def: ControlDef;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const FONT_PRESETS = ['Inter, ui-sans-serif, system-ui, sans-serif', 'Poppins, ui-sans-serif, sans-serif', 'Georgia, ui-serif, serif', 'ui-monospace, SFMono-Regular, Menlo, monospace'];
export const SHADOW_PRESETS: Record<string, string> = {
  none: 'none',
  soft: '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
  medium: '0 8px 24px rgba(0,0,0,0.10), 0 3px 8px rgba(0,0,0,0.06)',
  strong: '0 20px 40px rgba(0,0,0,0.25)',
  glow: '0 0 24px rgba(99,102,241,0.45)',
};

const hex6 = (v: string) => (toHex(v) ?? '#000000').slice(0, 7);
const idOf = (def: ControlDef, suffix = '') => `studio-${def.id.replace(/[^a-zA-Z0-9]+/g, '-')}${suffix}`;
const text = (def: ControlDef, value: string, placeholder: string | undefined, onChange: (v: string) => void, extra: Record<string, unknown> = {}) => (
  <TextInput id={idOf(def)} size="sm" labelText={def.label} value={value} placeholder={placeholder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} spellCheck={false} {...extra} />
);

const ColorInput: React.FC<ControlProps> = ({ def, value, placeholder, onChange }) => (
  <div className={styles.colorField}>
    {text(def, value, placeholder, onChange)}
    <input type="color" className={styles.colorSwatch} aria-label={`${def.label} (sélecteur)`} value={hex6(value || placeholder || '')} onChange={(e) => onChange(e.target.value)} />
  </div>
);

/** Vrai pendant un geste de l'utilisateur sur le curseur : Carbon rappelle `onChange` aussi quand la valeur change de l'extérieur (annuler, import…). */
function useUserGesture() {
  const active = useRef(false);
  useEffect(() => {
    const stop = () => (active.current = false);
    window.addEventListener('pointerup', stop);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, []);
  const start = () => (active.current = true);
  return { active, bind: { onPointerDown: start, onMouseDown: start, onTouchStart: start, onKeyDown: start, onKeyUp: () => (active.current = false), onBlur: () => (active.current = false) } };
}

const LengthInput: React.FC<ControlProps> = ({ def, value, placeholder, onChange }) => {
  const gesture = useUserGesture();
  const m = value.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);
  const unit = m?.[2] ?? 'px';
  const max = unit === 'px' ? 64 : unit === '%' ? 100 : 4;
  return (
    <div className={styles.lengthField}>
      {text(def, value, placeholder, onChange)}
      {m && (
        <div {...gesture.bind}>
          <Slider id={idOf(def, '-slider')} hideTextInput labelText="" ariaLabelInput={`${def.label} (curseur)`} min={0} max={max} step={unit === 'px' || unit === '%' ? 1 : 0.05} value={parseFloat(m[1])} onChange={({ value: v }: { value: number }) => gesture.active.current && onChange(`${v}${unit}`)} />
        </div>
      )}
    </div>
  );
};

export const ScaleInput: React.FC<ControlProps> = ({ def, value, onChange }) => {
  const scale = generateScale(value);
  return (
    <div className={styles.scaleField}>
      <ColorInput def={def} value={value} onChange={onChange} />
      {scale && (
        <span className={styles.scaleStrip} aria-hidden="true">
          {SCALE_STEPS.map((s) => (
            <i key={s} style={{ background: scale[s] }} title={`${s} ${scale[s]}`} />
          ))}
        </span>
      )}
    </div>
  );
};

/** Choisit le composant Carbon adapté au type de token. */
export const ControlInput: React.FC<ControlProps> = (props) => {
  const { def, value, placeholder, onChange } = props;
  switch (def.kind) {
    case 'scale':
      return <ScaleInput {...props} />;
    case 'color':
      return <ColorInput {...props} />;
    case 'length':
      return <LengthInput {...props} />;
    case 'number':
      return text(def, value, placeholder, onChange, { type: 'number' });
    case 'boolean':
      return <Toggle id={idOf(def)} size="sm" labelText={def.label} labelA="" labelB="" toggled={value === 'true'} onToggle={(on: boolean) => onChange(String(on))} />;
    case 'font':
      return (
        <>
          {text(def, value, placeholder, onChange, { list: 'studio-fonts' })}
          <datalist id="studio-fonts">
            {FONT_PRESETS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </>
      );
    case 'shadow':
      return (
        <div className={styles.shadowField}>
          {text(def, value, placeholder, onChange)}
          <Select id={idOf(def, '-preset')} size="sm" labelText={`${def.label} (préréglage)`} hideLabel value="" onChange={(e: React.ChangeEvent<HTMLSelectElement>) => e.target.value && onChange(SHADOW_PRESETS[e.target.value])}>
            <SelectItem value="" text="Préréglage…" />
            {Object.keys(SHADOW_PRESETS).map((k) => (
              <SelectItem key={k} value={k} text={k} />
            ))}
          </Select>
        </div>
      );
    default:
      return text(def, value, placeholder, onChange);
  }
};

/** Contraste texte/fond (aide à l'accessibilité, équivalent du contrast-checker de TweakCN). */
export const ContrastBadge: React.FC<{ foreground: string; background: string }> = ({ foreground, background }) => {
  const { t } = useTranslation();
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return null;
  const level = wcagLevel(ratio);
  return (
    <Tag size="sm" type={level === 'fail' ? 'red' : level === 'AA-large' ? 'warm-gray' : 'green'} title={t('contrast', 'Contraste')}>
      {ratio}:1 · {level}
    </Tag>
  );
};
