import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildCatalog, buildGlobalControls, readControl, visibleAt, type ControlDef } from '../core/catalog';
import { getComponent, resolveComponentToken } from '../core/components';
import { getIn } from '../core/path';
import { resolveTemplate } from '../core/catalog';
import { ContrastBadge, ControlInput } from './controls';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

export const ESSENTIALS = 'essentials';

const ControlRow: React.FC<{ def: ControlDef; perMode?: boolean }> = ({ def, perMode }) => {
  const { store } = useServices();
  const { doc, base, mode } = useStudio();
  const { t } = useTranslation();
  const value = readControl(doc, def, mode);
  const path = resolveTemplate(def.template, mode);
  const modified = JSON.stringify(getIn(doc, path)) !== JSON.stringify(getIn(base, path));
  const inherited = def.component ? resolveComponentToken(doc, mode, def.component.id, def.component.variant, def.component.state, def.component.prop) : null;
  const placeholder = inherited?.value ?? undefined;

  return (
    <div className={styles.controlRow} data-modified={modified} data-testid={`control-${def.id}`}>
      <label>
        <span className={styles.controlLabel}>{def.label}</span>
        <ControlInput
          def={def}
          value={value}
          placeholder={placeholder}
          onChange={(v) => (def.kind === 'scale' && def.scaleFamily ? store.setScale(def.scaleFamily, v) : store.setValue(def, v, { perMode }))}
        />
      </label>
      {def.component && value === '' && <small className={styles.origin}>{inherited?.source ? t('inheritedFrom', 'Hérité de {{path}}', { path: inherited.source.slice(2).join(' › ') }) : t('inheritedGlobal', 'Token global')}</small>}
      {def.id === 'colors.surface.{mode}.foreground' && <ContrastBadge foreground={value} background={readControl(doc, { ...def, template: ['colors', 'surface', '{mode}', 'background'] }, mode)} />}
      {modified && (
        <button type="button" className={styles.linkButton} onClick={() => store.resetValue(def)} aria-label={t('reset', 'Réinitialiser {{label}}', { label: def.label })}>
          ↺
        </button>
      )}
    </div>
  );
};

const groupBy = (defs: ControlDef[]): [string, ControlDef[]][] => {
  const m = new Map<string, ControlDef[]>();
  defs.forEach((d) => m.set(d.group, [...(m.get(d.group) ?? []), d]));
  return [...m.entries()];
};

/** Panneau central : contrôles de la sélection courante (essentiels, catégorie ou composant → variante → état). */
export const ControlsPanel: React.FC = () => {
  const { doc, level, selection, mode } = useStudio();
  const { t } = useTranslation();
  const [perMode, setPerMode] = useState(false);
  const catalog = useMemo(() => buildCatalog(doc), [doc]);

  if (selection.component) {
    const spec = getComponent(selection.component);
    if (!spec) return null;
    if (level === 'simple') return <p className={styles.hint}>{t('componentsNeedAdvanced', 'La personnalisation des composants est disponible en mode Avancé.')}</p>;
    const variant = selection.variant ?? spec.variants[0];
    const state = selection.state ?? 'default';
    const defs = catalog.filter((d) => d.component?.id === spec.id && d.component.variant === variant && d.component.state === state && visibleAt(d, level));
    return (
      <section aria-label={spec.label}>
        <h2>
          {spec.label} › {variant} › {state}
        </h2>
        <label className={styles.inlineCheck}>
          <input type="checkbox" checked={perMode} onChange={(e) => setPerMode(e.target.checked)} /> {t('perMode', 'Valeur distincte clair / sombre')} ({mode})
        </label>
        {defs.map((d) => (
          <ControlRow key={d.id} def={d} perMode={perMode} />
        ))}
      </section>
    );
  }

  const category = selection.category ?? ESSENTIALS;
  const defs = (category === ESSENTIALS ? catalog.filter((d) => d.level === 'simple') : catalog.filter((d) => d.category === category && visibleAt(d, level))).filter((d) => d.category !== 'components');
  return (
    <section aria-label={category}>
      {groupBy(defs).map(([group, list]) => (
        <fieldset key={group} className={styles.group}>
          <legend>{group}</legend>
          {list.map((d) => (
            <ControlRow key={d.id} def={d} />
          ))}
        </fieldset>
      ))}
      {defs.length === 0 && <p className={styles.hint}>{t('nothingHere', 'Rien à régler à ce niveau.')}</p>}
    </section>
  );
};

export { buildGlobalControls };
