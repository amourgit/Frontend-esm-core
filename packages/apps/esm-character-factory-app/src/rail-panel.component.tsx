import React from 'react';
import { SectionNavPanel } from '@egen-civitas/esm-framework';

// Contenu de l'option « Character Factory » du rail gauche (zone gauche) : les sous-options de la section
// `character-factory`, lues sur le slot `topbar-nav-slot` (routes.json), sans seconde déclaration à maintenir.
const RailPanel: React.FC = () => <SectionNavPanel section="character-factory" />;

export default RailPanel;
