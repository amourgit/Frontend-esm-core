"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SITES_LIST, SiteItem, getSiteByUuid } from '../data/sitesData';

export interface SiteContextType {
  selectedSiteUuid: string | null;
  selectedSite: SiteItem | null;
  setSelectedSiteUuid: (uuid: string | null) => void;
  availableSites: SiteItem[];
  clearSite: () => void;
  activeSiteSubTab: 'applications' | 'membres' | 'ressources' | 'taches' | 'activite' | 'parametres' | 'informations';

  // Compatibility properties
  selectedServiceUuid: string | null;
  selectedService: SiteItem | null;
  setSelectedServiceUuid: (uuid: string | null) => void;
  availableServices: SiteItem[];
  clearService: () => void;
  activeServiceSubTab: 'applications' | 'membres' | 'ressources' | 'taches' | 'activite' | 'parametres' | 'informations';
}

export const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSiteUuid, setSelectedSiteUuidState] = useState<string | null>(null);

  // Sync site UUID from URL path if present
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    // Path example: ['sites', 'srv-8f92a10b', 'applications'] or ['services', 'srv-8f92a10b']
    if (pathParts[0] === 'sites' || pathParts[0] === 'services') {
      const candidateUuid = pathParts[1];
      if (candidateUuid && (candidateUuid.startsWith('srv-') || candidateUuid.startsWith('site-'))) {
        setSelectedSiteUuidState(candidateUuid);
      }
    }
  }, [location.pathname]);

  const selectedSite = useMemo(() => {
    if (!selectedSiteUuid) return null;
    return getSiteByUuid(selectedSiteUuid) || null;
  }, [selectedSiteUuid]);

  const setSelectedSiteUuid = useCallback((uuid: string | null) => {
    setSelectedSiteUuidState(uuid);
  }, []);

  const clearSite = useCallback(() => {
    setSelectedSiteUuidState(null);
  }, []);

  // Determine active sub tab from path
  const activeSiteSubTab = useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if ((pathParts[0] === 'sites' || pathParts[0] === 'services') && pathParts.length >= 3) {
      const sub = pathParts[2].toLowerCase();
      if (sub === 'membres') return 'membres';
      if (sub === 'ressources') return 'ressources';
      if (sub === 'taches') return 'taches';
      if (sub === 'activite') return 'activite';
      if (sub === 'parametres') return 'parametres';
      if (sub === 'informations' || sub === 'infos') return 'informations';
    }
    return 'applications';
  }, [location.pathname]);

  return (
    <SiteContext.Provider
      value={{
        selectedSiteUuid,
        selectedSite,
        setSelectedSiteUuid,
        availableSites: SITES_LIST,
        clearSite,
        activeSiteSubTab,

        // Backward compatibility bindings
        selectedServiceUuid: selectedSiteUuid,
        selectedService: selectedSite,
        setSelectedServiceUuid: setSelectedSiteUuid,
        availableServices: SITES_LIST,
        clearService: clearSite,
        activeServiceSubTab: activeSiteSubTab,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}

export const useSiteContext = useSite;

// Compatibility aliases
export const ServiceProvider = SiteProvider;
export const useService = useSite;
export const useServiceContext = useSite;
export const ServiceContext = SiteContext;
