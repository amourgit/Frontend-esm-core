import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Layers, Shield, Users, AppWindow } from 'lucide-react';
import {
  FilterBar,
  SiteCarousel,
  SiteSearchBar,
  matchesFilters,
  playXboxSound,
  useFilterSchema,
  type Filter,
  type FilterSchema,
  type SiteSummary,
} from '@egen-civitas/esm-framework';
import { SITES } from '../data/sites-data';
import { SitesBackground } from './sites-background.component';

// Visuels des cartes du carrousel (cycliques).
const SITE_IMAGES = [
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
];

const unique = (values: string[]) => Array.from(new Set(values));

const FILTER_SCHEMA: FilterSchema = {
  fields: [
    {
      id: 'category',
      label: 'Catégorie / Pôle',
      type: 'select',
      icon: <Layers className="w-3.5 h-3.5" />,
      options: unique(SITES.map((s) => s.category)).map((value) => ({ value, label: value })),
    },
    {
      id: 'shortName',
      label: 'Sigle / Code',
      type: 'select',
      icon: <Building2 className="w-3.5 h-3.5" />,
      options: SITES.map((s) => ({ value: s.shortName, label: `${s.shortName} — ${s.name}` })),
    },
    { id: 'head', label: 'Responsable / Direction', type: 'text', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'memberCount', label: 'Nombre de membres', type: 'number', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'appCount', label: 'Applications associées', type: 'number', icon: <AppWindow className="w-3.5 h-3.5" /> },
    {
      id: 'status',
      label: 'État opérationnel',
      type: 'select',
      icon: <Shield className="w-3.5 h-3.5" />,
      options: unique(SITES.map((s) => s.status)).map((value) => ({ value, label: value })),
    },
  ],
};

const getFieldValue = (site: SiteSummary, fieldId: string): unknown => (site as unknown as Record<string, unknown>)[fieldId];

/** Page `/sites` — choix d'un site : recherche, filtres avancés et carrousel. */
const SitesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const { fields, onChange } = useFilterSchema(FILTER_SCHEMA, filters, setFilters);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SITES.filter((site) => {
      if (filters.length > 0 && !matchesFilters(site, filters, FILTER_SCHEMA, getFieldValue)) return false;
      if (!q) return true;
      return [site.name, site.shortName, site.description, site.head, site.category, site.uuid].some((v) => v.toLowerCase().includes(q));
    }).map((site, index) => ({ ...site, imageUrl: SITE_IMAGES[index % SITE_IMAGES.length] }));
  }, [query, filters]);

  const reset = () => {
    playXboxSound('back');
    setQuery('');
    setFilters([]);
  };

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-120px)] flex flex-col text-slate-100 overflow-x-hidden overflow-y-auto py-3 select-none">
      <SitesBackground />
      <div className="w-full max-w-5xl mx-auto mb-1 px-4 sm:px-6 lg:px-8 shrink-0 relative z-30">
        <SiteSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Rechercher un site, direction, sigle (DSI, DRH, DFC...), responsable ou mot-clé..."
          activeFilterCount={filters.length}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={(open) => {
            playXboxSound('select');
            setFiltersOpen(open);
          }}
          onReset={reset}
          filterPanel={
            <FilterBar
              fields={fields}
              value={filters}
              onChange={onChange}
              addLabel="Ajouter un filtre de site"
              emptyLabel="Filtrer par Catégorie, Sigle, Responsable, Membres, Apps..."
              clearLabel="Effacer les filtres"
              aria-label="Filtrer les sites organisationnels"
              className="bg-transparent"
            />
          }
        />
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center relative z-10">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-white/10 text-slate-400 my-auto mx-4">
            <h3 className="text-base font-bold text-white mb-1">Aucun site ne correspond à ces critères</h3>
            <p className="text-xs max-w-sm mb-4">Essayez d'ajuster votre recherche ou réinitialisez les filtres actifs.</p>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <SiteCarousel
            sites={visible}
            height={500}
            className="w-full"
            onSelect={(site) => {
              playXboxSound('select');
              navigate(`/sites/${site.uuid}/applications`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SitesListPage;
