import React from 'react';
import { SectionNavPanel } from '@egen-civitas/esm-framework';
import { APP_ROUTE } from './pages';

// Contenu de l'option « Theme Studio » du rail gauche : les pages d'édition, lues sur `topbar-nav-slot` (routes.json).
const RailPanel: React.FC = () => <SectionNavPanel section={APP_ROUTE} />;

export default RailPanel;
