import React from 'react';
import styles from './quick-links.scss';

// =============================================================================
//  QUICK LINKS — Grille de raccourcis (panneau latéral)
//
//  Copié/adapté depuis Civitas-GED (PortalQuickLinks.tsx). Différences :
//  - `iconName` (enum fermée + switch interne à maintenir pour chaque
//    nouvelle icône) remplacé par `icon` : le composant d'icône directement
//    en prop (même principe que SocialLinks) — ajouter un raccourci avec une
//    nouvelle icône ne demande plus de toucher ce fichier.
//  - `route` + navigation interne (useNavigate) remplacés par `onSelectItem`,
//    laissé à l'appelant (cohérent avec HeroMosaic/BlogSection) : ce
//    composant ne décide pas comment on navigue.
//  - Pas de système de son ("playXboxSound") : non porté, spécifique à
//    l'habillage Xbox de GED.
// =============================================================================

export interface QuickLinkItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Cible de navigation optionnelle — libre à l'appelant de l'utiliser ou non dans onSelectItem. */
  target?: string;
}

export interface QuickLinksProps {
  items: QuickLinkItem[];
  onSelectItem: (item: QuickLinkItem) => void;
}

export function QuickLinks({ items, onSelectItem }: QuickLinksProps) {
  return (
    <div className={styles.grid}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} type="button" onClick={() => onSelectItem(item)} className={styles.tile}>
            <Icon className={styles.tileIcon} strokeWidth={1.75} />
            <span className={styles.tileLabel}>{item.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export default QuickLinks;

/* ============================================================================
 *  GUIDE D'UTILISATION — QuickLinks
 * ============================================================================
 *    import { Megaphone, Files, Calendar } from 'lucide-react';
 *
 *    <HomeSection as="div" variant="panel" title="Raccourcis" bare>
 *      <QuickLinks
 *        items={[
 *          { id: 'ql-1', title: 'Actualités', icon: Megaphone, target: '/actualites' },
 *          { id: 'ql-2', title: 'Documents', icon: Files, target: '/ged' },
 *        ]}
 *        onSelectItem={(item) => (item.target ? navigate(item.target) : showToast(`Ouverture de ${item.title}`))}
 *      />
 *    </HomeSection>
 * ==========================================================================*/
