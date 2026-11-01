import React from 'react';
import { useTranslation } from 'react-i18next';
import { navigate } from '@egen-civitas/esm-framework';

// =============================================================================
//  CONTENU DE TOPBAR DE L'APP — extension du slot `top-nav-app-slot` (niveau 2)
//
//  Rendue à gauche des options de navigation, UNIQUEMENT tant qu'une page de cette
//  app est montée (le filtrage est assuré par la TopBar). Chaque app déclare ainsi son
//  identité (logo + nom) et ses actions propres. Voir NAVIGATION.md de
//  @egen/esm-primary-navigation-app.
// =============================================================================

export default function HomeAppToolbar() {
  const { t } = useTranslation();
  const name = t('homeAppName', 'Accueil');

  return (
    <button
      type="button"
      title={name}
      onClick={() => navigate({ to: '${egenSpaBase}/home' })}
      className="flex h-8 items-center gap-2 rounded-lg py-0 pl-1.5 pr-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-[11px] font-bold text-white"
      >
        AC
      </span>
      <span className="max-w-40 truncate">{name}</span>
    </button>
  );
}
