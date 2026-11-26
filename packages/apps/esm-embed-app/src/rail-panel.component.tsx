import React from 'react';
import { SectionNavPanel } from '@egen-civitas/esm-framework';
import { useEmbedExtensionMeta } from './extension-context';

/** Panneau de rail d'une app embarquée : liste des sous-options de sa section (entrées `topbar-nav-slot` de même section), comme une app interne. */
const RailPanel: React.FC = () => {
  const { meta } = useEmbedExtensionMeta();
  const section = typeof meta.section === 'string' ? meta.section : undefined;
  return section ? <SectionNavPanel section={section} /> : null;
};

export default RailPanel;
