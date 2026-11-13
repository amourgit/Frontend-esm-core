import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportThemeJson, importThemeText, themeFileName } from '../core/import-export';
import { exportTweakcnCss } from '../core/tweakcn-adapter';
import { validateTheme } from '../core/validation';
import { useServices, useStudio } from './studio-context';
import styles from './studio.scss';

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const Toolbar: React.FC<{ onMessage: (m: string) => void }> = ({ onMessage }) => {
  const { store, runtime, library, applyPriority } = useServices();
  const state = useStudio();
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [libVersion, setLibVersion] = useState(0);
  const themes = library.list();
  void libVersion;
  const dirty = store.isDirty();

  const doImport = async (file: File) => {
    const out = importThemeText(await file.text(), state.doc);
    if (!out.ok || !out.doc) return onMessage(out.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' ') || t('importFailed', 'Import impossible.'));
    store.load(out.doc, file.name.replace(/\.(theme\.)?(json|css)$/i, ''));
    onMessage(t('importOk', 'Thème importé ({{format}}).', { format: out.format }));
  };

  const save = () => {
    const current = themes.find((x) => x.name === state.name);
    const saved = current ? library.save(current.id, state.doc, state.name) : library.create(state.name, state.doc);
    if (saved) library.setActive(saved.id);
    store.markSaved();
    setLibVersion((v) => v + 1);
    onMessage(t('saved', 'Thème « {{name}} » enregistré.', { name: state.name }));
  };

  const apply = () => {
    const { valid } = validateTheme(state.doc);
    if (!valid) return onMessage(t('invalidTheme', 'Thème invalide : corrigez les erreurs avant de l’appliquer.'));
    runtime.apply(state.doc, { priority: applyPriority });
    onMessage(t('applied', 'Thème appliqué à l’environnement.'));
  };

  // Application en direct : chaque modification est répercutée sur toute l'application.
  React.useEffect(() => {
    if (live && validateTheme(state.doc).valid) runtime.apply(state.doc, { priority: applyPriority });
  }, [live, state.doc, runtime, applyPriority]);

  return (
    <header className={styles.toolbar} role="toolbar" aria-label={t('actions', 'Actions')}>
      <input aria-label={t('themeName', 'Nom du thème')} value={state.name} onChange={(e) => store.rename(e.target.value)} />
      {dirty && <span className={styles.dirty}>● {t('modified', 'modifié')}</span>}
      <button type="button" onClick={() => store.undo()} disabled={!state.canUndo}>
        {t('undo', 'Annuler')}
      </button>
      <button type="button" onClick={() => store.redo()} disabled={!state.canRedo}>
        {t('redo', 'Rétablir')}
      </button>
      <button type="button" onClick={() => store.resetAll()} disabled={!dirty}>
        {t('resetAll', 'Tout réinitialiser')}
      </button>
      <select
        aria-label={t('library', 'Bibliothèque')}
        value=""
        onChange={(e) => {
          const th = library.get(e.target.value);
          if (th) store.load(th.doc, th.name);
        }}
      >
        <option value="">{t('openTheme', 'Ouvrir un thème…')}</option>
        {themes.map((th) => (
          <option key={th.id} value={th.id}>
            {th.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={save}>
        {t('save', 'Enregistrer')}
      </button>
      <button
        type="button"
        onClick={() => {
          const current = themes.find((x) => x.name === state.name);
          const copy = current ? library.duplicate(current.id) : library.create(`${state.name} (copie)`, state.doc);
          if (copy) store.load(copy.doc, copy.name);
          setLibVersion((v) => v + 1);
        }}
      >
        {t('duplicate', 'Dupliquer')}
      </button>
      <button type="button" onClick={() => fileRef.current?.click()}>
        {t('import', 'Importer')}
      </button>
      <input ref={fileRef} type="file" hidden accept=".json,.css,application/json,text/css" data-testid="import-input" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
      <button type="button" onClick={() => download(themeFileName(state.name), exportThemeJson(state.doc, { name: state.name }), 'application/json')}>
        {t('exportJson', 'Exporter JSON')}
      </button>
      <button type="button" onClick={() => download(`${themeFileName(state.name).replace('.theme.json', '')}.css`, exportTweakcnCss(state.doc), 'text/css')}>
        {t('exportCss', 'Exporter CSS (shadcn)')}
      </button>
      <label className={styles.inlineCheck}>
        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> {t('live', 'Aperçu sur toute l’application')}
      </label>
      <button type="button" onClick={apply}>
        {t('apply', 'Appliquer')}
      </button>
      <button
        type="button"
        onClick={() => {
          setLive(false);
          runtime.revert();
          onMessage(t('reverted', 'Thème de l’environnement rétabli.'));
        }}
      >
        {t('revert', 'Rétablir l’environnement')}
      </button>
    </header>
  );
};
