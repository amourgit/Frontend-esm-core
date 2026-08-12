import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigate, interpolateUrl, useConfig, useOnClickOutside, ExtensionSlot } from '@egen-civitas/esm-framework';
import { useTenant, useTenantMode } from '@egen-civitas/esm-tenant';
import { type ConfigSchema } from '../../config-schema';
import styles from './context-switcher.scss';

// =============================================================================
//  CONTEXT SWITCHER — Indicateur d'établissement / tenant courant
//
//  Positionné à gauche de la topbar (niveau 1), juste avant le logo.
//
//  Refonte du 8 août 2026 : ce composant affichait auparavant un menu
//  déroulant listant "mes établissements" (useAvailableTenants), issu de la
//  registry statique de tenants. Cette registry a été supprimée (voir
//  @egen-civitas/esm-tenant/src/types.ts) — le frontend ne connaît plus QUE l'ID du
//  tenant capturé dans l'URL courante, rien d'autre sur les autres espaces
//  auxquels l'utilisateur pourrait avoir accès.
//
//  Ce composant est donc désormais un simple INDICATEUR du tenant courant
//  (pas de sélection entre plusieurs espaces connus côté frontend). Les
//  actions "aller à l'espace général" / "demander un espace" / "rechercher
//  un espace" restent disponibles, car elles ne dépendent d'aucune donnée
//  de registry.
//
//  Pour réintroduire un vrai sélecteur multi-espaces (liste des
//  établissements auxquels l'utilisateur connecté a accès), il faudrait un
//  endpoint backend dédié (ex: GET /api/me/tenants) — hors périmètre de
//  cette refonte, qui porte uniquement sur la capture du tenant courant.
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

/** "mef-gabon" → "Mef Gabon" — humanise un slug brut pour affichage (aucun nom serveur disponible). */
const humanizeTenantId = (id: string): string =>
  id
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
  const activeTenantId = useTenant();
  const [open, setOpen] = useState(false);

  const isMultiTenant = tenantMode === 'multi';

  const menuRef = useOnClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const handleGoToGeneralSpace = useCallback(() => {
    setOpen(false);
    navigate({ to: interpolateUrl(config.logo.link) });
  }, [config.logo.link]);

  const currentLabel = activeTenantId ? humanizeTenantId(activeTenantId) : t('generalSpace', 'Espace Général');
  const currentSubLabel = activeTenantId ? t('establishment', 'Établissement') : t('centralSpace', 'Espace Central');
  const currentInitial = getInitials(currentLabel);

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('switchContext', 'Contexte courant : {{name}}', { name: currentLabel })}
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
        <div className={styles.dropdown} role="menu" aria-label={t('spaceActions', 'Actions')}>
          <div className={styles.dropdownHeader}>
            <BuildingIcon />
            <span>{currentLabel}</span>
          </div>

          <div className={styles.dropdownFooter}>
            {isMultiTenant && (
              <button type="button" className={styles.footerBtn} onClick={handleGoToGeneralSpace}>
                <BuildingIcon />
                {activeTenantId
                  ? t('goToGeneralSpace', "Aller à l'espace général")
                  : t('requestNewSpace', 'Demander un espace')}
              </button>
            )}

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
