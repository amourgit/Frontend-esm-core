import React from 'react';
import { SectionNavPanel } from '@egen-civitas/esm-framework';

// Contenu de l'option « Outils hors ligne » du rail gauche (zone gauche) : les sous-options de la section
// `offline-tools`, lues sur le slot `topbar-level2-nav` (routes.json), sans seconde déclaration à maintenir.
const RailPanel: React.FC = () => <SectionNavPanel section="offline-tools" />;

export default RailPanel;
