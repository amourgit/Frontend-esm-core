import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importThemeText } from '../core/import-export';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

/** Niveau Expert : le JSON EGEN complet, éditable (le visuel reste l'interface principale). */
export const JsonPanel: React.FC = () => {
  const { store } = useServices();
  const { doc } = useStudio();
  const { t } = useTranslation();
  const [text, setText] = useState(() => JSON.stringify(doc, null, 2));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setText(JSON.stringify(doc, null, 2)), [doc]);

  return (
    <section aria-label="JSON" className={styles.jsonPanel}>
      <textarea aria-label={t('themeJson', 'JSON du thème')} value={text} spellCheck={false} onChange={(e) => setText(e.target.value)} />
      <button
        type="button"
        onClick={() => {
          const out = importThemeText(text);
          if (!out.ok || !out.doc) return setError(out.issues.filter((i) => i.severity === 'error').map((i) => `${i.path} ${i.message}`).join(' · '));
          setError(null);
          store.load(out.doc);
        }}
      >
        {t('applyJson', 'Appliquer le JSON')}
      </button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
};
