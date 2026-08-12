import React from 'react';
import { useTranslation } from 'react-i18next';
import { interpolateUrl, navigate, useConfig } from '@egen-civitas/esm-framework';
import type { ConfigSchema } from '../config-schema';
import styles from './not-found-page.module.scss';

// =============================================================================
//  NOT FOUND PAGE
// =============================================================================
//  Copiée/collée depuis le composant NotFoundPage fourni, puis refactorisée :
//  - Tailwind (bg-white, text-black, bg-green-600...) → tokens du thème EGEN.
//    Contrairement à l'original (blanc/noir figés quel que soit le thème),
//    le fond de page est ici adaptatif (--colors-surface-*) : un aplat
//    blanc fixe sur une app qui supporte le thème sombre serait une
//    régression visuelle, pas une fidélité au design.
//  - BUG CORRIGÉ : le bouton appelait `router.push('/')` — `router` n'est
//    jamais importé/défini dans le composant source (ReferenceError au
//    clic). Remplacé par `navigate({ to: interpolateUrl('${egenSpaBase}/') })`,
//    le mécanisme standard du framework — pointe toujours vers la RACINE
//    RÉELLE du domaine/tenant courant (jamais une URL relative fragile ni
//    un domaine codé en dur), quel que soit le tenant/déploiement.
// =============================================================================

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();

  const handleGoHome = () => {
    navigate({ to: interpolateUrl('${egenSpaBase}/') });
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div
          className={styles.illustration}
          style={{ backgroundImage: 'url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)' }}
          aria-hidden="true"
        >
          <h1 className={styles.code}>{config.pageTitle}</h1>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{t('notFoundTitle', "On dirait que tu t'es perdu")}</h3>
          <p className={styles.description}>
            {t('notFoundDescription', "La page que tu cherches n'est pas disponible !")}
          </p>
          <button type="button" className={styles.homeButton} onClick={handleGoHome}>
            {t('notFoundGoHome', "Retour à l'accueil")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
