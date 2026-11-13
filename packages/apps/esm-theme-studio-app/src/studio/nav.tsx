import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildGlobalControls, categoriesOf, visibleAt } from '../core/catalog';
import { COMPONENTS } from '../core/components';
import { LEVELS } from '../core/types';
import { ESSENTIALS } from './controls-panel';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

const LEVEL_LABEL = { simple: 'Simple', advanced: 'Avancé', expert: 'Expert' } as const;

/** Navigation : niveau (Simple/Avancé/Expert), mode, catégories globales, composants → variantes → états. */
export const Nav: React.FC = () => {
  const { store } = useServices();
  const { doc, level, mode, selection } = useStudio();
  const { t } = useTranslation();
  const categories = useMemo(() => categoriesOf(buildGlobalControls(doc).filter((d) => visibleAt(d, level))), [doc, level]);
  const spec = COMPONENTS.find((c) => c.id === selection.component);

  return (
    <nav className={styles.nav} aria-label={t('themeStudio', 'Theme Studio')}>
      <div role="group" aria-label={t('level', 'Niveau')} className={styles.segmented}>
        {LEVELS.map((l) => (
          <button key={l} type="button" aria-pressed={level === l} onClick={() => store.setLevel(l)}>
            {t(`level_${l}`, LEVEL_LABEL[l])}
          </button>
        ))}
      </div>
      <div role="group" aria-label={t('editedMode', 'Mode édité')} className={styles.segmented}>
        {(['light', 'dark'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => store.setMode(m)}>
            {m === 'light' ? t('lightMode', 'Clair') : t('darkMode', 'Sombre')}
          </button>
        ))}
      </div>

      <h3>{t('foundations', 'Design global')}</h3>
      <ul>
        {[ESSENTIALS, ...categories].map((c) => (
          <li key={c}>
            <button type="button" aria-current={!selection.component && (selection.category ?? ESSENTIALS) === c} onClick={() => store.select({ category: c })}>
              {c === ESSENTIALS ? t('essentials', 'Essentiels') : c}
            </button>
          </li>
        ))}
      </ul>

      {level !== 'simple' && (
        <>
          <h3>{t('components', 'Composants')}</h3>
          <ul>
            {COMPONENTS.map((c) => (
              <li key={c.id}>
                <button type="button" aria-current={selection.component === c.id} onClick={() => store.select({ component: c.id, variant: c.variants[0], state: 'default' })}>
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
          {spec && (
            <div className={styles.variantPicker}>
              <label>
                {t('variant', 'Variante')}
                <select value={selection.variant ?? spec.variants[0]} onChange={(e) => store.select({ ...selection, variant: e.target.value })}>
                  {spec.variants.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('state', 'État')}
                <select value={selection.state ?? 'default'} onChange={(e) => store.select({ ...selection, state: e.target.value })}>
                  {spec.states.filter((s) => s === 'default' || level === 'expert').map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}
    </nav>
  );
};
