import React from 'react';
import { useTranslation } from 'react-i18next';
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

const ColorInput: React.FC<ControlProps> = ({ def, value, placeholder, onChange }) => (
  <span className={styles.colorField}>
    <input type="color" aria-label={def.label} value={hex6(value || placeholder || '')} onChange={(e) => onChange(e.target.value)} />
    <input type="text" aria-label={`${def.label} (valeur)`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
  </span>
);

const LengthInput: React.FC<ControlProps> = ({ def, value, placeholder, onChange }) => {
  const m = value.trim().match(/^(-?[\d.]+)(px|rem|em|%)?$/);
  const unit = m?.[2] ?? 'px';
  const max = unit === 'px' ? 64 : unit === '%' ? 100 : 4;
  return (
    <span className={styles.lengthField}>
      {m && <input type="range" aria-label={`${def.label} (curseur)`} min={0} max={max} step={unit === 'px' || unit === '%' ? 1 : 0.05} value={parseFloat(m[1])} onChange={(e) => onChange(`${e.target.value}${unit}`)} />}
      <input type="text" aria-label={def.label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
    </span>
  );
};

export const ScaleInput: React.FC<ControlProps> = ({ def, value, onChange }) => {
  const scale = generateScale(value);
  return (
    <span className={styles.scaleField}>
      <ColorInput def={def} value={value} onChange={onChange} />
      {scale && (
        <span className={styles.scaleStrip} aria-hidden="true">
          {SCALE_STEPS.map((s) => (
            <i key={s} style={{ background: scale[s] }} title={`${s} ${scale[s]}`} />
          ))}
        </span>
      )}
    </span>
  );
};

/** Choisit le widget adapté au type de token. */
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
      return <input type="number" aria-label={def.label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
    case 'boolean':
      return <input type="checkbox" aria-label={def.label} checked={value === 'true'} onChange={(e) => onChange(String(e.target.checked))} />;
    case 'font':
      return (
        <>
          <input type="text" list="studio-fonts" aria-label={def.label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          <datalist id="studio-fonts">
            {FONT_PRESETS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </>
      );
    case 'shadow':
      return (
        <span className={styles.shadowField}>
          <select aria-label={`${def.label} (préréglage)`} value="" onChange={(e) => e.target.value && onChange(SHADOW_PRESETS[e.target.value])}>
            <option value="">…</option>
            {Object.keys(SHADOW_PRESETS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input type="text" aria-label={def.label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        </span>
      );
    default:
      return <input type="text" aria-label={def.label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
};

/** Indicateur de contraste texte/fond (aide à l'accessibilité, cf. contrast-checker de TweakCN). */
export const ContrastBadge: React.FC<{ foreground: string; background: string }> = ({ foreground, background }) => {
  const { t } = useTranslation();
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return null;
  const level = wcagLevel(ratio);
  return (
    <span className={styles.contrast} data-level={level} title={t('contrast', 'Contraste')}>
      {ratio}:1 · {level}
    </span>
  );
};
