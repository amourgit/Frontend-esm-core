import React from 'react';
import { MapPin, Users } from 'lucide-react';
import { Section, SectionAction, SectionCard, SectionCardTitleButton, SectionGrid } from '@egen-civitas/esm-framework';

// =============================================================================
//  SITES — Implantations de l'organisation (cartes)
//
//  Source des données d'exemple : esm-annuaire-app (DIRECTORY_SITES).
// =============================================================================

export interface DirectorySite {
  id: string;
  name: string;
  city: string;
  address: string;
  employeeCount: number;
}

export interface SitesSectionProps {
  sites: DirectorySite[];
  onSelectSite?: (site: DirectorySite) => void;
  onSeeAll?: () => void;
}

export function SitesSection({ sites, onSelectSite, onSeeAll }: SitesSectionProps) {
  const totalStaff = sites.reduce((sum, site) => sum + site.employeeCount, 0);

  return (
    <Section
      title="Nos sites"
      count={sites.length}
      footer={`${sites.length} sites · ${totalStaff} collaborateurs`}
      footerActions={
        onSeeAll ? (
          <SectionAction size="sm" variant="outline" onClick={onSeeAll}>
            Guide des sites →
          </SectionAction>
        ) : undefined
      }
    >
      <SectionGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="md">
        {sites.map((site) => (
          <SectionCard as="article" key={site.id} className="gap-1.5">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-teal-300">
              <MapPin className="size-3.5 shrink-0" />
              {site.city}
            </span>
            <h3 className="m-0 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-teal-300">
              <SectionCardTitleButton onClick={() => onSelectSite?.(site)} className="line-clamp-2">
                {site.name}
              </SectionCardTitleButton>
            </h3>
            <p className="m-0 line-clamp-2 text-xs leading-relaxed text-slate-400">{site.address}</p>
            <span className="mt-auto flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11px] text-slate-300">
              <Users className="size-3.5 shrink-0 text-sky-400" />
              {site.employeeCount} collaborateurs
            </span>
          </SectionCard>
        ))}
      </SectionGrid>
    </Section>
  );
}

export default SitesSection;
