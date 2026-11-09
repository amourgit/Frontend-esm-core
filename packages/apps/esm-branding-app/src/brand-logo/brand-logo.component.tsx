import React from 'react';
import { interpolateUrl, navigate, useConfig } from '@egen-civitas/esm-framework';
import type { ConfigSchema } from '../config-schema';
import defaultLogo from '../default-logo';
import styles from './brand-logo.scss';

const isExternal = (url: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(url);

/**
 * Logo de l'entreprise, injecté dans la TopBar comme extension. Tout vient de la configuration de l'app
 * (`useConfig` est réactif : un changement de config se voit à chaud). Ne sait rien de l'endroit où il est monté :
 * `topbar-slot` (niveau `main`, région gauche) par défaut, déplaçable par la config d'extensions du déploiement.
 */
const BrandLogo: React.FC = () => {
  const { organization, logo } = useConfig<ConfigSchema>();
  const label = [organization.name, organization.description].filter(Boolean).join(' — ') || 'Logo';
  const href = logo.link ? interpolateUrl(logo.link) : null;

  const image = (
    <img
      alt={logo.alt || label}
      className={styles.image}
      referrerPolicy="no-referrer"
      src={logo.src || defaultLogo}
      style={
        {
          '--logo-height': `${logo.height}px`,
          '--logo-compact-height': `${logo.compactHeight}px`,
        } as React.CSSProperties
      }
    />
  );

  if (!href) {
    return (
      <div className={styles.logo} title={label}>
        {image}
      </div>
    );
  }

  return (
    <a
      className={styles.logo}
      href={href}
      onClick={(event) => {
        // Clic modifié (nouvel onglet…) ou lien externe : le navigateur s'en charge ; sinon navigation sans rechargement.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        if (isExternal(href)) return;
        event.preventDefault();
        navigate({ to: href });
      }}
      title={label}
    >
      {image}
    </a>
  );
};

export default BrandLogo;
