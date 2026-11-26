import React, { useEffect, useState } from 'react';
import EmbedFrame from './embed-frame.component';
import { useEmbedExtensionMeta } from './extension-context';
import { coreServices } from './lib/core-services';
import { findEntryByName, getEmbedConfig, type EmbedEntry } from './lib/entries';

/**
 * Vue d'extension : la page `view` d'une app embarquée, affichée dans un slot du Core (apps internes ou framework)
 * sous forme d'iframe dédiée. Seules les contributions APPROUVÉES par l'opérateur existent (filtrées par serve-prod).
 */
const ExtensionView: React.FC = () => {
  const { app, ext } = useEmbedExtensionMeta();
  const [state, setState] = useState<{ entry: EmbedEntry; view: { path: string; height?: number } } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!app || !ext) return;
    getEmbedConfig(window.getEgenSpaBase())
      .then((config) => {
        const entry = findEntryByName(config, app);
        const decl = entry?.contributions.find((d) => d.name === ext && d.view);
        if (!cancelled && entry && decl?.view) setState({ entry, view: { path: decl.view, height: decl.height } });
      })
      .catch(() => undefined); // un slot ne doit jamais casser l'interface qui l'héberge : en cas d'échec, il reste vide
    return () => {
      cancelled = true;
    };
  }, [app, ext]);

  return state ? <EmbedFrame entry={state.entry} core={coreServices} view={state.view} /> : null;
};

export default ExtensionView;
