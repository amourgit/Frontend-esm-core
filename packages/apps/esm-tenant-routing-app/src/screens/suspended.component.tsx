import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig, navigate, interpolateUrl } from '@egen/esm-framework';
import { useTenant } from '@egen/esm-tenant';
import { type ConfigSchema } from '../config-schema';
import styles from './suspended.scss';

// =============================================================================
//  SUSPENDED PAGE — Écran de tenant suspendu
//  Affiché quand le tenant actif est marqué suspended:true.
//  Design glass / dark cohérent avec le reste du framework.
// =============================================================================

const SuspendedPage: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const tenant = useTenant();

  // Forcer data-theme dark (page publique, pas de nav)
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'dark');
    return () => {
      if (prev) root.setAttribute('data-theme', prev);
      else root.removeAttribute('data-theme');
    };
  }, []);

  const handleGoHome = () => {
    navigate({ to: interpolateUrl(config.landingPageUrl) });
  };

  const tenantName = tenant?.name ?? tenant?.id ?? '';
  const suspendedMsg =
    tenant?.suspendedMessage ??
    t('suspendedDefaultMsg', 'Cet espace est temporairement indisponible. Veuillez contacter l\'administrateur.');

  return (
    <div className={styles.page}>
      {/* Orbs décoratifs */}
      <div className={styles.orbA} aria-hidden="true" />
      <div className={styles.orbB} aria-hidden="true" />

      <div className={styles.card} role="main">
        {/* Icône */}
        <div className={styles.iconWrapper} aria-hidden="true">
          <svg
            className={styles.icon}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
            <path
              d="M24 14v12M24 32v2"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Badge */}
        <span className={styles.badge}>
          {t('suspendedBadge', 'Espace suspendu')}
        </span>

        {/* Titre */}
        <h1 className={styles.title}>
          {tenantName
            ? t('suspendedTitleWith', '{{name}} est temporairement suspendu', { name: tenantName })
            : t('suspendedTitle', 'Espace temporairement suspendu')}
        </h1>

        {/* Message */}
        <p className={styles.message}>{suspendedMsg}</p>

        {/* Infos de contact */}
        <div className={styles.contactBox}>
          <p className={styles.contactLabel}>
            {t('suspendedContact', 'Pour toute demande de réactivation, contactez :')}
          </p>
          <a
            href="mailto:support@civitas-gabon.com"
            className={styles.contactLink}
          >
            support@civitas-gabon.com
          </a>
        </div>

        {/* CTA retour accueil */}
        <button className={styles.btnHome} onClick={handleGoHome}>
          {t('suspendedGoHome', 'Retour à l\'accueil')}
        </button>

        {/* Tenant ID pour le support */}
        {tenant?.id && (
          <p className={styles.tenantId}>
            {t('suspendedTenantId', 'Référence :')} <code>{tenant.id}</code>
          </p>
        )}
      </div>
    </div>
  );
};

export default SuspendedPage;
