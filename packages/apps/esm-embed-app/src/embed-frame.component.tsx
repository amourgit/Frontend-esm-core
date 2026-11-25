import React, { useEffect, useRef } from 'react';
import { createEmbedHost } from '@egen-civitas/esm-embed-host';
import { effectiveGrants } from '@egen-civitas/esm-embed-protocol';
import { createCoreProviders, type CoreServices } from './lib/providers';
import type { EmbedEntry } from './lib/entries';

interface Props {
  entry: EmbedEntry;
  core: CoreServices;
}

/** Monte l'hôte `esm-embed-host` d'une app embarquée ; démonte proprement (iframe, abonnements, canal RPC). */
const EmbedFrame: React.FC<Props> = ({ entry, core }) => {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const m = entry.manifest;
    const host = createEmbedHost({
      moduleName: entry.name,
      src: m.url,
      // Grants effectifs = demandé (manifeste) ∩ approuvé (opérateur) : une seule implémentation, celle du protocole.
      grants: effectiveGrants(m.capabilities, entry.approved),
      providers: createCoreProviders(core),
      navigation: { route: m.route, mode: m.navigation.mode, sensitiveParams: m.navigation.sensitiveParams },
      limits: entry.limits,
      title: m.title,
    });
    host.mount(container.current);
    return () => host.destroy();
  }, [entry, core]);
  return <div ref={container} style={{ width: '100%', height: '100%' }} data-testid="embed-frame-container" />;
};

export default EmbedFrame;
