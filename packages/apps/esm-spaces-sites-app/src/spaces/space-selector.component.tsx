import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
  showSnackbar,
} from '@egen-civitas/esm-framework';
import { setActiveSpace, useSpacesSites } from '../store/spaces-sites.store';
import styles from '../context-selectors/context-selectors.scss';

/** Choix de l'Espace actif (intranet, extranet…). La liste vient de la configuration du déploiement. */
export const SpaceSelector: React.FC = () => {
  const { t } = useTranslation();
  const { spaces, spaceId } = useSpacesSites();

  if (spaces.length === 0 || !spaceId) return null;

  const handleChange = (id: string) => {
    const space = spaces.find((s) => s.id === id);
    if (!space || id === spaceId) return;
    setActiveSpace(id);
    showSnackbar({
      isLowContrast: true,
      kind: 'success',
      title: t('spaceActivated', 'Space activated: {{name}}', { name: space.name }),
    });
  };

  return (
    <MorphSelect value={spaceId} onValueChange={handleChange} className={styles.selector}>
      <MorphSelectTrigger>
        <MorphSelectValue placeholder={t('space', 'Space')} />
      </MorphSelectTrigger>
      <MorphSelectContent>
        {spaces.map((space) => (
          <MorphSelectItem key={space.id} value={space.id} label={space.name}>
            {space.name}
          </MorphSelectItem>
        ))}
      </MorphSelectContent>
    </MorphSelect>
  );
};
