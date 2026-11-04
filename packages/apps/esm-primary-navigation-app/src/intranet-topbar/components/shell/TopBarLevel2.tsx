import React from 'react';
import { useAssignedExtensions } from '@egen-civitas/esm-framework';
import { useActiveAppModules } from '../../hooks/useActiveAppModules';
import { TopBarRegion, isAllowedByRule, topBarSlotName, useRegionRule } from '../../kit';

// =============================================================================
//  TOPBAR — NIVEAU 2 (barre d'outils de l'application active)
//
//  Même modèle que le niveau 1 : trois régions neutres, alimentées par des éléments et des slots.
//  La barre est TOUJOURS transparente et sans bordure (elle se fond avec le niveau 1 et les rails).
//
//   ┌──────────────┬─────────────────────────────────────────┬─────────────┐
//   │ l2-left      │ l2-center                                │ l2-right    │
//   │ app active   │ navigation (élément global « nav ») +    │ globaux     │
//   │ (+ historique│ extensions `topbar-l2-center-slot`       │ (assistant  │
//   │ top-nav-app- │                                          │ IA…)        │
//   │ slot)        │                                          │             │
//   └──────────────┴─────────────────────────────────────────┴─────────────┘
//
//  Une app peut tout personnaliser (masquer la navigation, n'afficher que ses boutons…) via le layout
//  `l2-*` (voir kit/layout-store.ts) ; la barre elle-même ne connaît aucune app.
// =============================================================================

/** Slot historique du contenu de l'app active (équivaut à `topbar-l2-left-slot`). */
export const TOP_NAV_APP_SLOT = 'top-nav-app-slot';

export function TopBarLevel2() {
  const activeModules = useActiveAppModules();
  const rule = useRegionRule('l2-left');
  const modern = useAssignedExtensions(topBarSlotName('l2-left'));
  const legacy = useAssignedExtensions(TOP_NAV_APP_SLOT);

  // Le séparateur n'apparaît que si la zone gauche affiche réellement du contenu d'app.
  const hasAppContent = [...modern, ...legacy].some((e) => {
    const isGlobal = (e.meta as { global?: boolean } | undefined)?.global === true;
    return (isGlobal || activeModules.has(e.moduleName)) && isAllowedByRule(e.name, isGlobal, rule);
  });

  return (
    <div
      role="toolbar"
      aria-label="Barre d'outils de l'application"
      data-slot="topbar-level2"
      className="relative z-30 flex h-10 w-full items-center gap-1 bg-transparent px-2 sm:h-11 sm:px-4 md:px-6 lg:px-7"
    >
      <TopBarRegion id="l2-left" className="flex shrink-0 items-center gap-1 empty:hidden" />
      {hasAppContent && (
        <span aria-hidden="true" data-testid="topbar-app-divider" className="mx-1 h-5 w-px shrink-0 bg-white/10" />
      )}
      <TopBarRegion id="l2-center" className="flex min-w-0 flex-1 items-center justify-between gap-2" />
      <TopBarRegion id="l2-right" className="flex shrink-0 items-center" />
    </div>
  );
}
