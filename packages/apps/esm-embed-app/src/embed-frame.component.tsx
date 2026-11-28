import React, { useEffect, useRef } from 'react';
import { createEmbedHost } from '@egen-civitas/esm-embed-host';
import { effectiveGrants, effectiveIframe } from '@egen-civitas/esm-embed-protocol';
import { createCoreProviders, type CoreServices } from './lib/providers';
import type { EmbedEntry } from './lib/entries';

interface Props {
  entry: EmbedEntry;
  core: CoreServices;
  /** Vue d'extension : page de l'app affichée DANS un slot (sans navigation partagée avec l'URL du Core). */
  view?: { path: string; height?: number };
}

/** Monte l'hôte `esm-embed-host` d'une app embarquée (page ou vue d'extension) ; démonte proprement (iframe, abonnements, canal RPC). */
const EmbedFrame: React.FC<Props> = ({ entry, core, view }) => {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const m = entry.manifest;
    const host = createEmbedHost({
      moduleName: entry.name,
      src: view ? new URL(view.path, m.url).href : m.url,
      // Grants effectifs = demandé (manifeste) ∩ approuvé (opérateur) : une seule implémentation, celle du protocole.
      grants: effectiveGrants(m.capabilities, entry.approved),
      // Droits d'iframe (sandbox/allow) : même règle, même implémentation (demande de l'app ∩ plafond de l'opérateur).
      iframe: effectiveIframe(m.iframe, entry.approved.iframe),
      providers: createCoreProviders(core, { config: entry.config, title: m.title }),
      navigation: view
        ? undefined
        : { route: m.route, mode: m.navigation.mode, sensitiveParams: m.navigation.sensitiveParams },
      ...(view ? { minHeight: view.height ?? 48 } : {}),
      limits: entry.limits,
      title: view ? `${m.title}` : m.title,
    });
    host.mount(container.current);
    if (!view) {
      // Page entière : l'iframe occupe toute la hauteur de la zone. Le protocole ne connaît que
      // `navigation.resize(px)` ; pour une page, remplir est le comportement attendu (comme les apps internes).
      host.iframe.style.height = '100%';
    }
    return () => host.destroy();
  }, [entry, core, view]);
  // `data-egen-fill` sur la racine : le shell donne alors height:100% au conteneur single-spa
  // (#egen-apps-container > div:has(> [data-egen-fill])), ce qui rend la hauteur résolvable jusqu'à l'iframe.
  // Absente pour les vues d'extension : le slot gère la hauteur via navigation.resize.
  return (
    <div
      ref={container}
      data-egen-fill={view ? undefined : ''}
      style={view ? { width: '100%' } : { width: '100%', height: '100%' }}
      data-testid="embed-frame-container"
    />
  );
};

export default EmbedFrame;
