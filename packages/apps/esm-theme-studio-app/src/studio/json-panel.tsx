import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InlineNotification, TextArea } from '@carbon/react';
import { importThemeText } from '../core/import-export';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

/** Page « JSON » (Expert) : le thème EGEN complet, éditable. Le JSON reste validé avant toute prise en compte. */
export const JsonPanel: React.FC = () => {
  const { store } = useServices();
  const { doc, level } = useStudio();
  const { t } = useTranslation();
  const [text, setText] = useState(() => JSON.stringify(doc, null, 2));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setText(JSON.stringify(doc, null, 2)), [doc]);

  if (level !== 'expert') {
    return (
      <div className={styles.empty}>
        <InlineNotification kind="info" lowContrast hideCloseButton title={t('jsonNeedsExpert', 'L’éditeur JSON est réservé au mode Expert.')} />
        <Button kind="tertiary" size="sm" onClick={() => store.setLevel('expert')}>
          {t('switchToExpert', 'Passer en mode Expert')}
        </Button>
      </div>
    );
  }
  return (
    <section aria-label="JSON" className={styles.jsonPanel}>
      <TextArea id="studio-json" labelText={t('themeJson', 'JSON du thème')} rows={24} value={text} spellCheck={false} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} />
      <Button
        kind="primary"
        size="sm"
        onClick={() => {
          const out = importThemeText(text);
          if (!out.ok || !out.doc) return setError(out.issues.filter((i) => i.severity === 'error').map((i) => `${i.path} ${i.message}`).join(' · '));
          setError(null);
          store.load(out.doc, undefined, store.getState().base);
        }}
      >
        {t('applyJson', 'Appliquer le JSON')}
      </Button>
      {error && <InlineNotification kind="error" lowContrast hideCloseButton title={t('invalidJson', 'JSON invalide')} subtitle={error} />}
    </section>
  );
};
