import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmbedFrame from './embed-frame.component';
import { coreServices } from './lib/core-services';
import { findEntry, loadEmbedConfig, type EmbedEntry } from './lib/entries';

type State = { status: 'loading' } | { status: 'ready'; entry: EmbedEntry } | { status: 'error'; message: string };

/** Page d'une app embarquée : retrouve l'entrée dont la route correspond à l'URL du Core, puis monte son hôte. */
const Root: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const base = window.getEgenSpaBase();
    loadEmbedConfig(base)
      .then((config) => {
        const entry = findEntry(config, window.location.pathname, base);
        if (cancelled) return;
        setState(entry ? { status: 'ready', entry } : { status: 'error', message: t('embedNotFound', "Cette application embarquée n'est pas déclarée.") });
      })
      .catch(() => !cancelled && setState({ status: 'error', message: t('embedLoadError', "Impossible de charger la configuration des applications embarquées.") }));
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (state.status === 'loading') return <div role="status">{t('embedLoading', 'Chargement…')}</div>;
  if (state.status === 'error') return <div role="alert">{state.message}</div>;
  return <EmbedFrame entry={state.entry} core={coreServices} />;
};

export default Root;
