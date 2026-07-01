import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate, interpolateUrl, useConfig } from '@igen/esm-framework';
import { useTenant, useTenantMode, getAllTenants } from '@igen/esm-tenant';
import { type ConfigSchema } from '../../../config-schema';
import styles from './context-switcher.scss';

// =============================================================================
//  CONTEXT SWITCHER — Menu déroulant de sélection d'établissement
//
//  Positionné à gauche de la topbar (niveau 1).
//  Permet à l'utilisateur de choisir son contexte d'établissement.
//  Par défaut : espace général (tenant courant).
//  Au changement : redirige vers le portail captif du tenant cible si
//  l'utilisateur n'y est pas authentifié, sinon vers son espace tenant.
// =============================================================================

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

const BuildingIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.25" fill="none" />
    <path d="M5 15V10h6v5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    <rect x="4.5" y="6.5" width="2" height="2" rx="0.25" fill="currentColor" opacity="0.7" />
    <rect x="9.5" y="6.5" width="2" height="2" rx="0.25" fill="currentColor" opacity="0.7" />
    <path d="M6 4V2.5a2 2 0 014 0V4" stroke="currentColor" strokeWidth="1.25" />
  </svg>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
  >
    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ContextSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const tenantMode = useTenantMode();
  const activeTenant = useTenant();
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ne s'affiche qu'en mode multi-tenant
  const isMultiTenant = tenantMode === 'multi';

  useEffect(() => {
    if (!isMultiTenant) return;
    const all = getAllTenants();
    setTenants(
      all
        .filter((t) => !t.suspended)
        .map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.id,
          active: t.id === activeTenant?.id,
        })),
    );
  }, [isMultiTenant, activeTenant?.id]);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = useCallback(
    (tenant: TenantOption) => {
      setOpen(false);
      if (tenant.active) return;
      // Construire l'URL du tenant cible
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      const rootDomain = window.location.hostname.split('.').slice(1).join('.') || window.location.hostname;
      const tenantUrl = `${protocol}//${tenant.slug}.${rootDomain}${port}${interpolateUrl(config.logo.link)}`;
      window.location.href = tenantUrl;
    },
    [config.logo.link],
  );

  if (!isMultiTenant) return null;

  const currentLabel = activeTenant?.name ?? t('generalSpace', 'Espace général');
  const firstLetter = currentLabel.charAt(0).toUpperCase();

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('switchContext', 'Changer de contexte : {{name}}', { name: currentLabel })}
      >
        {/* Avatar initiale */}
        <span className={styles.avatar} aria-hidden="true">
          {firstLetter}
        </span>

        {/* Nom du contexte courant */}
        <span className={styles.currentLabel}>
          <span className={styles.currentLabelSub}>{t('context', 'Contexte')}</span>
          <span className={styles.currentLabelName}>{currentLabel}</span>
        </span>

        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown} role="listbox" aria-label={t('selectEstablishment', 'Choisir un établissement')}>
          <div className={styles.dropdownHeader}>
            <BuildingIcon />
            <span>{t('myEstablishments', 'Mes établissements')}</span>
          </div>

          <div className={styles.dropdownList}>
            {tenants.length === 0 ? (
              <div className={styles.emptyState}>{t('noEstablishments', 'Aucun établissement disponible')}</div>
            ) : (
              tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  role="option"
                  aria-selected={tenant.active}
                  className={`${styles.option} ${tenant.active ? styles.optionActive : ''}`}
                  onClick={() => handleSelect(tenant)}
                >
                  <span className={styles.optionAvatar}>{tenant.name.charAt(0).toUpperCase()}</span>
                  <span className={styles.optionName}>{tenant.name}</span>
                  {tenant.active && (
                    <span className={styles.optionCheck}>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <button
              className={styles.footerBtn}
              onClick={() => {
                setOpen(false);
                navigate({ to: interpolateUrl('${egenSpaBase}/home') });
              }}
            >
              <BuildingIcon />
              {t('requestNewSpace', 'Demander un espace')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher;
