'use client';

import React, { useMemo } from 'react';
import { Briefcase, Building2, Server, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Combobox,
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
  type ComboboxItemData,
} from '@egen-civitas/esm-framework';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSite } from '../../context/SiteContext';
import { playXboxSound } from '../../utils/xboxAudio';
import { type SiteItem } from '../../data/sitesData';
import styles from './topbar-level1.scss';

// =============================================================================
//  Sélecteurs du niveau 1 de la TopBar (à droite du logo)
//
//   • ESPACE (Intranet, Extranet…) → composant `MorphSelect` du framework (esm-styleguide),
//     utilisé tel quel (composition Trigger / Value / Content / Item). Espace par défaut : Intranet
//     (défini par `WorkspaceProvider`).
//   • SITE → composant `Combobox` du framework, variante « Groupes + icônes + descriptions »
//     de la page de démonstration du home (items avec `group`, `icon`, `description`).
//
//  Mise en page : en desktop (≥ 1024px) les deux sélecteurs sont en ligne ; en tablette / mobile
//  ils sont en colonne (voir `.selectors` dans topbar-level1.scss).
// =============================================================================

interface WorkspaceAndSiteSelectorsColumnProps {
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

/** Icône d'un site selon sa catégorie (groupe du Combobox). */
function siteIcon(category: string): React.ReactNode {
  switch (category) {
    case 'Administration & Personnel':
      return <Users aria-hidden />;
    case 'Moyens Généraux':
      return <Building2 aria-hidden />;
    case 'Finances & Budget':
      return <Briefcase aria-hidden />;
    default:
      return <Server aria-hidden />;
  }
}

export function WorkspaceAndSiteSelectorsColumn({ onShowNotification }: WorkspaceAndSiteSelectorsColumnProps) {
  const navigate = useNavigate();
  const { currentWorkspace, setWorkspaceId, availableWorkspaces } = useWorkspace();
  const { selectedSite, setSelectedSiteUuid, availableSites, clearSite } = useSite();

  // Items du Combobox : groupés par catégorie (les items d'un même groupe doivent être consécutifs).
  const siteItems = useMemo<ComboboxItemData[]>(
    () =>
      [...availableSites]
        .sort((a, b) => a.category.localeCompare(b.category, 'fr'))
        .map((site: SiteItem) => ({
          value: site.uuid,
          label: site.name,
          description: `${site.shortName} · ${site.memberCount} membres`,
          group: site.category,
          icon: siteIcon(site.category),
          keywords: [site.shortName, site.head, site.category],
        })),
    [availableSites],
  );

  const handleWorkspaceChange = (id: string) => {
    const ws = availableWorkspaces.find((w) => w.id === id);
    if (!ws || ws.id === currentWorkspace.id) return;
    playXboxSound('select');
    setWorkspaceId(ws.id);
    onShowNotification?.(`Espace activé : ${ws.name}`, 'success');
  };

  // Le Combobox renvoie '' quand on re-sélectionne le site courant (comportement shadcn) :
  // c'est la réinitialisation du filtre (« Tous les sites »).
  const handleSiteChange = (uuid: string) => {
    playXboxSound('select');
    if (!uuid) {
      clearSite();
      navigate('/sites');
      onShowNotification?.('Filtre de site réinitialisé', 'info');
      return;
    }
    const site = availableSites.find((s) => s.uuid === uuid);
    setSelectedSiteUuid(uuid);
    navigate(`/sites/${uuid}/applications`);
    if (site) onShowNotification?.(`Site activé : ${site.name}`, 'success');
  };

  return (
    <div className={styles.selectors}>
      {/* ESPACE — MorphSelect */}
      <MorphSelect value={currentWorkspace.id} onValueChange={handleWorkspaceChange} className={styles.selector}>
        <MorphSelectTrigger>
          <MorphSelectValue placeholder="Espace" />
        </MorphSelectTrigger>
        <MorphSelectContent>
          {availableWorkspaces.map((ws) => (
            <MorphSelectItem key={ws.id} value={ws.id} label={ws.name}>
              {ws.name}
            </MorphSelectItem>
          ))}
        </MorphSelectContent>
      </MorphSelect>

      {/* SITE — Combobox « Groupes + icônes + descriptions » */}
      <Combobox
        items={siteItems}
        value={selectedSite?.uuid ?? ''}
        onValueChange={handleSiteChange}
        placeholder="Tous les sites"
        searchPlaceholder="Rechercher un site..."
        emptyMessage="Aucun site trouvé."
        align="start"
        className={styles.selectorSite}
        aria-label="Sélection du site"
      />
    </div>
  );
}

// Alias for compatibility
export const WorkspaceAndServiceSelectorsColumn = WorkspaceAndSiteSelectorsColumn;
