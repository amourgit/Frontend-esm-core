import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { playXboxSound, SiteTabbedLayout, type SiteTabOption } from '@egen-civitas/esm-framework';
import { getSiteByUuid, isSiteTab, type SiteTabId } from '../data/sites-data';
import { SitesBackground } from './sites-background.component';

const TABS: SiteTabOption<SiteTabId>[] = [
  { id: 'applications', label: 'Applications & Outils' },
  { id: 'membres', label: 'Membres & Équipes' },
  { id: 'ressources', label: 'Ressources (GED)' },
  { id: 'taches', label: 'Mes tâches' },
  { id: 'activite', label: 'Activité' },
  { id: 'parametres', label: 'Paramètres' },
];

/**
 * Route `/sites/:siteId/*` — enveloppe d'un site : onglets latéraux, titre, et
 * la page de l'onglet actif (`<Outlet>`). Un site inconnu renvoie à la liste.
 */
const SiteLayoutPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const site = getSiteByUuid(siteId);

  if (!site) return <Navigate to="/sites" replace />;

  const segment = pathname.split('/').filter(Boolean)[2];
  const activeTab: SiteTabId = isSiteTab(segment) ? segment : 'applications';

  return (
    <div className="relative">
      <SitesBackground />
      <SiteTabbedLayout
        className="relative z-10"
        activeTab={activeTab}
        tabs={TABS}
        onTabChange={(tab) => {
          playXboxSound('select');
          navigate(`/sites/${site.uuid}/${tab}`);
        }}
        sidebarHeader={
          <button
            type="button"
            onClick={() => {
              playXboxSound('select');
              navigate('/sites');
            }}
            title="Revenir au choix du site"
            className="self-start text-xs text-slate-400 hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1.5 pb-2 border-b border-white/10 w-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Changer de site</span>
          </button>
        }
        mainHeader={
          <div className="pb-1.5 mb-2 border-b border-white/10 shrink-0">
            <h1 className="text-base sm:text-xl font-bold text-white">{site.name}</h1>
          </div>
        }
      >
        <Outlet context={{ site }} />
      </SiteTabbedLayout>
    </div>
  );
};

export default SiteLayoutPage;
