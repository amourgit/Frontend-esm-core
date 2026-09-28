import React from 'react';
import styles from './home-section.scss';

// =============================================================================
//  HOME SECTION — Squelette réutilisable pour chaque section de l'accueil
//
//  Chaque section de la page d'accueil (À la Une, Actualités, Liens rapides,
//  panneau latéral...) a le même besoin de base : un titre optionnel, une
//  description optionnelle, un slot d'actions optionnel (ex: "Voir tout"),
//  et une zone de contenu libre. Ce composant factorise ce squelette une
//  seule fois au lieu de le dupliquer dans chaque section (ce qui était le
//  cas dans Civitas-GED, où chaque section réécrivait son propre <h2>/<p>).
//
//  Entièrement personnalisable :
//  - `as` change la balise racine ('section' par défaut, 'div' pour une
//    zone qui n'est pas sémantiquement une section de page, ex. le panneau
//    latéral).
//  - `variant` change l'habillage visuel : 'transparent' (par défaut, sur le
//    fond animé de la page) ou 'panel' (carte vitrée, utilisée pour le
//    panneau latéral).
//  - `titleAs` change le niveau de titre HTML (h2 par défaut).
//  - `actions` reçoit n'importe quel contenu (bouton, lien, menu...) aligné
//    à droite du titre.
//  - `bare` retire le padding interne du variant 'panel', pour les sections
//    qui gèrent elles-mêmes leur mise en page interne.
// =============================================================================

export interface HomeSectionProps {
  /** Identifiant HTML de la section (ancre, aria-labelledby...). */
  id?: string;
  /** Balise racine du composant. @default 'section' */
  as?: 'section' | 'div' | 'aside';
  /** Habillage visuel. @default 'transparent' */
  variant?: 'transparent' | 'panel';
  /** Titre de la section. Omis => pas d'en-tête du tout. */
  title?: React.ReactNode;
  /** Niveau de titre HTML. @default 'h2' */
  titleAs?: 'h2' | 'h3';
  /** Texte ou contenu descriptif sous le titre. */
  description?: React.ReactNode;
  /** Contenu aligné à droite du titre (bouton "Voir tout", filtre...). */
  actions?: React.ReactNode;
  /** Libellé d'accessibilité si le titre visuel ne suffit pas à décrire la section. */
  ariaLabel?: string;
  /** Retire le padding interne du variant 'panel'. */
  bare?: boolean;
  /** Classe additionnelle sur la racine. */
  className?: string;
  children?: React.ReactNode;
}

export function HomeSection({
  id,
  as = 'section',
  variant = 'transparent',
  title,
  titleAs = 'h2',
  description,
  actions,
  ariaLabel,
  bare = false,
  className,
  children,
}: HomeSectionProps) {
  const Root = as;
  const TitleTag = titleAs;
  const hasHeader = Boolean(title || description || actions);

  return (
    <Root
      id={id}
      aria-label={ariaLabel}
      className={[
        styles.root,
        variant === 'panel' ? styles.panel : styles.transparent,
        bare && variant === 'panel' ? styles.bare : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {title && <TitleTag className={styles.title}>{title}</TitleTag>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </Root>
  );
}

export default HomeSection;

/* ============================================================================
 *  GUIDE D'UTILISATION — HomeSection
 * ============================================================================
 *  Section simple, sur le fond animé de la page :
 *
 *    <HomeSection title="À la une">
 *      <HeroMosaic tiles={tiles} />
 *    </HomeSection>
 *
 *  Section avec description et action à droite :
 *
 *    <HomeSection
 *      title="Actualités"
 *      description="Les dernières publications de l'organisation."
 *      actions={<button onClick={...}>Voir tout</button>}
 *    >
 *      <BlogSection articles={articles} />
 *    </HomeSection>
 *
 *  Carte vitrée du panneau latéral (utilisé par ProfileCard/QuickLinks/...) :
 *
 *    <HomeSection as="div" variant="panel" title="Documents" bare>
 *      <Documents items={documents} />
 *    </HomeSection>
 *
 *  Omettre `title` (et `description`/`actions`) rend uniquement le
 *  conteneur + son contenu, sans en-tête — utile quand la section gère son
 *  propre titre en interne (cas de certaines cartes portées telles quelles
 *  depuis GED, pour limiter les changements visuels lors du portage).
 * ==========================================================================*/
