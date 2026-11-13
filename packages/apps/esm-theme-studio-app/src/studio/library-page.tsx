import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FileUploaderButton, Tag, Tile } from '@carbon/react';
import { exportThemeJson, importThemeText, themeFileName } from '../core/import-export';
import { exportTweakcnCss } from '../core/tweakcn-adapter';
import { useNotify, useServices, useStudio } from './studio-context';
import styles from './studio.scss';

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Page « Mes thèmes » : bibliothèque, import (JSON EGEN / TweakCN) et export. Équivalent de la liste « thèmes enregistrés » de TweakCN. */
export const LibraryPage: React.FC = () => {
  const { store, library } = useServices();
  const state = useStudio();
  const notify = useNotify();
  const { t } = useTranslation();
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  void version;
  const themes = library.list();
  const activeId = library.getActiveId();

  const doImport = async (file: File) => {
    const out = importThemeText(await file.text(), state.doc);
    if (!out.ok || !out.doc) return notify(out.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' ') || t('importFailed', 'Import impossible.'));
    store.load(out.doc, file.name.replace(/\.(theme\.)?(json|css)$/i, ''), state.base);
    notify(t('importOk', 'Thème importé ({{format}}).', { format: out.format }));
  };

  const save = () => {
    const current = themes.find((x) => x.name === state.name);
    const saved = current ? library.save(current.id, state.doc, state.name) : library.create(state.name, state.doc);
    if (saved) library.setActive(saved.id);
    store.markSaved();
    refresh();
    notify(t('saved', 'Thème « {{name}} » enregistré.', { name: state.name }));
  };

  return (
    <section aria-label={t('myThemes', 'Mes thèmes')}>
      <div className={styles.actions}>
        <Button kind="primary" size="sm" onClick={save}>{t('save', 'Enregistrer')}</Button>
        <FileUploaderButton labelText={t('import', 'Importer')} accept={['.json', '.css']} buttonKind="tertiary" size="sm" disableLabelChanges onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <Button kind="tertiary" size="sm" onClick={() => download(themeFileName(state.name), exportThemeJson(state.doc, { name: state.name }), 'application/json')}>{t('exportJson', 'Exporter JSON')}</Button>
        <Button kind="tertiary" size="sm" onClick={() => download(`${themeFileName(state.name).replace('.theme.json', '')}.css`, exportTweakcnCss(state.doc), 'text/css')}>{t('exportCss', 'Exporter CSS (shadcn)')}</Button>
      </div>

      {themes.length === 0 && <p className={styles.hint}>{t('noThemes', 'Aucun thème enregistré pour le moment.')}</p>}
      {themes.map((th) => (
        <Tile key={th.id} className={styles.themeTile} data-testid={`theme-${th.id}`}>
          <div>
            <strong>{th.name}</strong> {th.id === activeId && <Tag size="sm" type="green">{t('current', 'actuel')}</Tag>}
            <small className={styles.hint}> · {new Date(th.updatedAt).toLocaleString()}</small>
          </div>
          <div className={styles.actions}>
            <Button kind="ghost" size="sm" onClick={() => { store.load(th.doc, th.name); library.setActive(th.id); refresh(); }}>{t('open', 'Ouvrir')}</Button>
            <Button kind="ghost" size="sm" onClick={() => { library.duplicate(th.id); refresh(); }}>{t('duplicate', 'Dupliquer')}</Button>
            <Button kind="danger--ghost" size="sm" onClick={() => { library.remove(th.id); refresh(); }}>{t('delete', 'Supprimer')}</Button>
          </div>
        </Tile>
      ))}
    </section>
  );
};
