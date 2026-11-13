import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ContentSwitcher, Switch, TextInput, Tag, Toggle } from '@carbon/react';
import { validateTheme } from '../core/validation';
import { LEVELS } from '../core/types';
import { useNotify, useServices, useStudio } from './studio-context';
import styles from './studio.scss';

const LEVEL_LABEL = { simple: 'Simple', advanced: 'Avancé', expert: 'Expert' } as const;

/**
 * Barre d'actions de l'éditeur (équivalent de l'action-bar de TweakCN) : nom, annuler/rétablir/réinitialiser,
 * niveau, mode édité, et remise du thème au moteur (« Appliquer » délègue au runtime : le Studio produit, le moteur applique).
 */
export const Toolbar: React.FC = () => {
  const { store, runtime, applyPriority } = useServices();
  const state = useStudio();
  const notify = useNotify();
  const { t } = useTranslation();
  const [live, setLive] = useState(false);
  const dirty = store.isDirty();

  const apply = () => {
    if (!validateTheme(state.doc).valid) return notify(t('invalidTheme', 'Thème invalide : corrigez les erreurs avant de l’appliquer.'));
    runtime.apply(state.doc, { priority: applyPriority });
    notify(t('applied', 'Thème appliqué à l’environnement.'));
  };

  // Aperçu sur toute l'application : chaque modification est remise au moteur (via le même contrat).
  React.useEffect(() => {
    if (live && validateTheme(state.doc).valid) runtime.apply(state.doc, { priority: applyPriority });
  }, [live, state.doc, runtime, applyPriority]);

  return (
    <header className={styles.toolbar} role="toolbar" aria-label={t('actions', 'Actions')}>
      <TextInput id="studio-theme-name" size="sm" hideLabel labelText={t('themeName', 'Nom du thème')} value={state.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => store.rename(e.target.value)} />
      {dirty && <Tag size="sm" type="warm-gray">● {t('modified', 'modifié')}</Tag>}
      <Button kind="ghost" size="sm" onClick={() => store.undo()} disabled={!state.canUndo}>{t('undo', 'Annuler')}</Button>
      <Button kind="ghost" size="sm" onClick={() => store.redo()} disabled={!state.canRedo}>{t('redo', 'Rétablir')}</Button>
      <Button kind="ghost" size="sm" onClick={() => store.resetAll()} disabled={!dirty}>{t('resetAll', 'Tout réinitialiser')}</Button>

      <ContentSwitcher size="sm" aria-label={t('level', 'Niveau')} selectedIndex={LEVELS.indexOf(state.level)} onChange={({ name }: { name?: string | number }) => store.setLevel(name as (typeof LEVELS)[number])}>
        {LEVELS.map((l) => <Switch key={l} name={l} text={t(`level_${l}`, LEVEL_LABEL[l])} />)}
      </ContentSwitcher>
      <ContentSwitcher size="sm" aria-label={t('editedMode', 'Mode édité')} selectedIndex={state.mode === 'light' ? 0 : 1} onChange={({ name }: { name?: string | number }) => store.setMode(name as 'light' | 'dark')}>
        <Switch name="light" text={t('lightMode', 'Clair')} />
        <Switch name="dark" text={t('darkMode', 'Sombre')} />
      </ContentSwitcher>

      <Toggle id="studio-live" size="sm" labelText={t('live', 'Aperçu sur toute l’application')} hideLabel labelA={t('liveOff', 'Aperçu global : non')} labelB={t('liveOn', 'Aperçu global : oui')} toggled={live} onToggle={setLive} />
      <Button kind="primary" size="sm" onClick={apply}>{t('apply', 'Appliquer')}</Button>
      <Button kind="ghost" size="sm" onClick={() => { setLive(false); runtime.revert(); notify(t('reverted', 'Thème de l’environnement rétabli.')); }}>{t('revert', 'Rétablir l’environnement')}</Button>
    </header>
  );
};
