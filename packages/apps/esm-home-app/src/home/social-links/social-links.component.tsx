import React from 'react';
import { useAnimate } from 'framer-motion';
import styles from './social-links.scss';

// =============================================================================
//  SOCIAL LINKS — Grille de liens externes, effet "clip-path" au survol
//
//  Copié/adapté depuis Civitas-GED (ClipPathLinks.tsx). BUG CORRIGÉ AU
//  PASSAGE : la version d'origine avait les comptes GitHub/LinkedIn/
//  Twitter/Instagram/Facebook/Discord PERSONNELS d'un tiers (un contributeur
//  du template d'origine) codés EN DUR — aucun rapport avec CIVITAS. `rows`
//  est maintenant une prop obligatoire, sans aucun lien par défaut.
// =============================================================================

export interface SocialLinkItem {
  id: string;
  href: string;
  /** Icône (composant lucide-react ou équivalent : accepte une prop className). */
  icon?: React.ComponentType<{ className?: string }>;
  /** Alternative à `icon` : logo en image (ex: partenaire externe). */
  imgSrc?: string;
  imgAlt?: string;
  /** Classe appliquée à l'image (contrôle sa taille). */
  imgClassName?: string;
}

export interface SocialLinksProps {
  /** Lignes de liens — la longueur de chaque ligne détermine son nombre de colonnes. */
  rows: SocialLinkItem[][];
}

export function SocialLinks({ rows }: SocialLinksProps) {
  return (
    <div className={styles.root}>
      {rows.map((row, i) => (
        <div key={i} className={styles.row} style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
          {row.map((item) => (
            <SocialLinkBox key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SocialLinks;

// ── Boîte de lien individuelle ──────────────────────────────────────────────

const NO_CLIP = 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)';
const BOTTOM_RIGHT_CLIP = 'polygon(0 0, 100% 0, 0 0, 0% 100%)';
const TOP_RIGHT_CLIP = 'polygon(0 0, 0 100%, 100% 100%, 0% 100%)';
const BOTTOM_LEFT_CLIP = 'polygon(100% 100%, 100% 0, 100% 100%, 0 100%)';
const TOP_LEFT_CLIP = 'polygon(0 0, 100% 0, 100% 100%, 100% 0)';

type Side = 'left' | 'right' | 'top' | 'bottom';

const ENTRANCE_KEYFRAMES: Record<Side, [string, string]> = {
  left: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  bottom: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  top: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  right: [TOP_LEFT_CLIP, NO_CLIP],
};

const EXIT_KEYFRAMES: Record<Side, [string, string]> = {
  left: [NO_CLIP, TOP_RIGHT_CLIP],
  bottom: [NO_CLIP, TOP_RIGHT_CLIP],
  top: [NO_CLIP, TOP_RIGHT_CLIP],
  right: [NO_CLIP, BOTTOM_LEFT_CLIP],
};

function getNearestSide(e: React.MouseEvent<HTMLAnchorElement>): Side {
  const box = e.currentTarget.getBoundingClientRect();
  const distances = [
    { side: 'left' as Side, proximity: Math.abs(box.left - e.clientX) },
    { side: 'right' as Side, proximity: Math.abs(box.right - e.clientX) },
    { side: 'top' as Side, proximity: Math.abs(box.top - e.clientY) },
    { side: 'bottom' as Side, proximity: Math.abs(box.bottom - e.clientY) },
  ];
  return distances.sort((a, b) => a.proximity - b.proximity)[0].side;
}

function SocialLinkBox({ item }: { item: SocialLinkItem }) {
  const [scope, animate] = useAnimate();
  const Icon = item.icon;

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    animate(scope.current, { clipPath: ENTRANCE_KEYFRAMES[getNearestSide(e)] });
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    animate(scope.current, { clipPath: EXIT_KEYFRAMES[getNearestSide(e)] });
  };

  const content = item.imgSrc ? (
    <img src={item.imgSrc} alt={item.imgAlt ?? ''} className={item.imgClassName ?? styles.icon} />
  ) : Icon ? (
    <Icon className={styles.iconGlyph} />
  ) : null;

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={styles.box}
    >
      {content}
      <div ref={scope} style={{ clipPath: BOTTOM_RIGHT_CLIP }} className={styles.boxHover}>
        {content}
      </div>
    </a>
  );
}

/* ============================================================================
 *  GUIDE D'UTILISATION — SocialLinks
 * ============================================================================
 *    import { Github, Linkedin, Youtube } from 'lucide-react';
 *
 *    <SocialLinks
 *      rows={[
 *        [{ id: 'github', href: 'https://github.com/...', icon: Github }],
 *        [
 *          { id: 'linkedin', href: 'https://linkedin.com/...', icon: Linkedin },
 *          { id: 'youtube', href: 'https://youtube.com/...', icon: Youtube },
 *        ],
 *      ]}
 *    />
 *
 *  Chaque sous-tableau de `rows` est une ligne ; sa longueur fixe le nombre
 *  de colonnes de CETTE ligne (reproduit la mise en page d'origine : une
 *  ligne à 2 colonnes, une à 4, une à 3 — libre à vous de faire autrement).
 *  `icon` (composant) OU `imgSrc` (logo image) — au moins l'un des deux.
 * ==========================================================================*/
