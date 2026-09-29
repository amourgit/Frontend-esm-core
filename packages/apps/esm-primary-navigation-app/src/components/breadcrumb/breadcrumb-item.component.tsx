import React from 'react';
import { ConfigurableLink, Type, useConfig, validators } from '@egen-civitas/esm-framework';

// =============================================================================
//  BREADCRUMB ITEM — Extension réutilisable et déclarative pour le niveau 2
//  de la topbar (slot "top-nav-breadcrumb-slot", voir breadcrumb.component.tsx)
//
//  Avant ce composant, le slot existait mais AUCUNE app ne pouvait s'y
//  brancher sans reconstruire à la main le contrat CSS attendu par
//  topbar-options.scss (classe globale `.breadcrumb-item`, séparateur `›`
//  automatique entre deux items, style "actif" sur le dernier) : le niveau 2
//  était donc extensible sur le papier, mais pas réellement opérationnel.
//
//  Ce composant applique ce contrat pour vous — exactement le même principe
//  que `GenericLink` (voir generic-link.component.tsx) déjà utilisé pour les
//  slots de navigation de niveau 1 : une app tierce déclare simplement, dans
//  son propre routes.json :
//
//    {
//      "name": "mon-fil-ariane-item",
//      "slot": "top-nav-breadcrumb-slot",
//      "component": "breadcrumbItem",
//      "order": 10,
//      "config": { "title": "Mes patients", "target": "${egenSpaBase}/mon-app/liste" }
//    }
//
//  `target` est optionnel : à omettre pour l'item courant (page active, non
//  cliquable) — il sera alors rendu comme un simple texte, stylé comme
//  "dernier item" par topbar-options.scss si c'est effectivement le dernier
//  élément du fil (ordre croissant via "order").
// =============================================================================

export const breadcrumbItemConfigSchema = {
  title: {
    _type: Type.String,
    _default: 'Breadcrumb',
    _description: "Libellé affiché pour cet élément du fil d'Ariane.",
  },
  target: {
    _type: Type.String,
    _default: '',
    _description:
      "URL vers laquelle naviguer au clic. Laisser vide pour un item non cliquable (typiquement la page active, en fin de fil).",
    _validators: [validators.isUrl],
  },
};

export interface BreadcrumbItemConfig {
  title: string;
  target: string;
}

export default function BreadcrumbItem() {
  const { title, target } = useConfig<BreadcrumbItemConfig>();

  if (!target) {
    return <span className="breadcrumb-item">{title}</span>;
  }

  return (
    <ConfigurableLink to={target} className="breadcrumb-item">
      {title}
    </ConfigurableLink>
  );
}
