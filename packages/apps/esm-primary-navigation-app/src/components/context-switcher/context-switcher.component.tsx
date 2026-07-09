import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate, interpolateUrl, useConfig, useOnClickOutside, ExtensionSlot } from '@egen/esm-framework';
import { useTenant, useTenantMode, useAvailableTenants } from '@egen/esm-tenant';
import { type ConfigSchema } from '../../config-schema';
import styles from './context-switcher.scss';

// =============================================================================
//  CONTEXT SWITCHER — Sélecteur d'établissement / tenant
//
//  Positionné à gauche de la topbar (niveau 1), juste avant le logo.
//  Toujours visible (modes single / off / multi) : seul le comportement du
//  dropdown change — en single/off, la liste peut être vide ou réduite à
//  l'établissement courant ; en multi, elle liste tous les tenants
//  disponibles dans la registry.
//
//  Au changement d'établissement : redirection vers le sous-domaine du
//  tenant cible (le portail captif y gère l'auth si nécessaire).
// =============================================================================

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

/** Initiales (jusqu'à 2 lettres) à partir d'un libellé : "Espace Général" → "EG". */
const getInitials = (label: string): string => {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

const ContextSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();
  const tenantMode = useTenantMode();
  const activeTenant = useTenant();
  const availableTenants = useAvailableTenants();
  const [open, setOpen] = useState(false);

  const isMultiTenant = tenantMode === 'multi';

  const menuRef = useOnClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const tenants = useMemo(
    () =>
      availableTenants
        .filter((tenant) => !tenant.suspended)
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug ?? tenant.id,
          initial: (tenant.meta?.logoText as string | undefined)?.toUpperCase() ?? getInitials(tenant.name),
          active: tenant.id === activeTenant?.id,
        })),
    [availableTenants, activeTenant?.id],
  );

  const handleSelect = useCallback(
    (tenant: (typeof tenants)[number]) => {
      setOpen(false);
      if (tenant.active) return;
      const { protocol, port, hostname } = window.location;
      const portSegment = port ? `:${port}` : '';
      const rootDomain = hostname.split('.').slice(1).join('.') || hostname;
      window.location.href = `${protocol}//${tenant.slug}.${rootDomain}${portSegment}${interpolateUrl(
        config.logo.link,
      )}`;
    },
    [config.logo.link],
  );

  const currentLabel = activeTenant?.name ?? t('generalSpace', 'Espace Général');
  const currentSubLabel = activeTenant ? t('establishment', 'Établissement') : t('centralSpace', 'Espace Central');
  const currentInitial = getInitials(currentLabel);

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('switchContext', 'Changer de contexte : {{name}}', { name: currentLabel })}
      >
        <span className={styles.avatar} aria-hidden="true">
          {currentInitial}
        </span>
        <span className={styles.currentLabel}>
          <span className={styles.currentLabelSub}>{currentSubLabel}</span>
          <span className={styles.currentLabelName}>{currentLabel}</span>
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className={styles.dropdown}
          role="listbox"
          aria-label={t('selectEstablishment', 'Choisir un établissement')}
        >
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
                  type="button"
                  role="option"
                  aria-selected={tenant.active}
                  className={`${styles.option} ${tenant.active ? styles.optionActive : ''}`}
                  onClick={() => handleSelect(tenant)}
                >
                  <span className={styles.optionAvatar}>{tenant.initial}</span>
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
              type="button"
              className={styles.footerBtn}
              onClick={() => {
                setOpen(false);
                navigate({ to: interpolateUrl('${egenSpaBase}/home') });
              }}
            >
              <BuildingIcon />
              {isMultiTenant
                ? t('requestNewSpace', 'Demander un espace')
                : t('goToGeneralSpace', "Aller à l'espace général")}
            </button>

            {/* Bouton "Rechercher un espace" — relocalisé depuis l'ancien
                bouton "Localisation" de la topbar (esm-login-app), même
                route/service, nouveau point d'entrée uniquement. */}
            <div onClick={() => setOpen(false)}>
              <ExtensionSlot name="context-switcher-footer-slot" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSwitcher;
