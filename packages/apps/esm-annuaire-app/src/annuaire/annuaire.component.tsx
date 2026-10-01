import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Search,
  X,
  MapPin,
  Briefcase,
  Sparkles,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Network,
  Globe,
  LayoutGrid,
  List,
  Rows3,
  FilterX,
  Info,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  Tag as TagIcon,
  Award,
  Phone,
  Mail,
  QrCode,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TabbedViewLayout } from '../components/layout/tabbed-view-layout.component';
import { TabsContent } from '../components/ui/animated-tabs.component';
import { ClickExpandGallery, type ClickExpandItem, type ClickExpandTone } from '../components/ui/click-expand-gallery.component';
import {
  DIRECTORY_EMPLOYEES,
  DIRECTORY_SITES,
  DirectoryEmployee,
  getEmployeeUuid,
} from '../data/directory-data';
import { EmployeeCard } from '../directory/employee-card.component';
import { EmployeeListView } from '../directory/employee-list-view.component';
import { EmployeeDetailModal } from '../directory/employee-detail-modal.component';
import {
  FilterBar,
  PageBackground,
  playXboxSound,
  useFilterSchema,
  matchesFilters,
  type Filter,
  type FilterSchema,
} from '@egen-civitas/esm-framework';

// Image d'arrière-plan de l'annuaire
import annuaireBg from '../assets/annuaire-bg.jpg';

interface AnnuairePageProps {
  onShowNotification?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  /**
   * Source de données optionnelle. Par défaut : DIRECTORY_EMPLOYEES.
   * Passez ici vos données chargées depuis l'API pour un annuaire dynamique.
   */
  employees?: DirectoryEmployee[];
  /**
   * Appelée par le bouton « Actualiser ». Rechargez vos données ici
   * (le composant attend la fin de la promesse avant de confirmer).
   */
  onRefresh?: () => void | Promise<void>;
}

type DirectorySite = (typeof DIRECTORY_SITES)[number];
type Lang = 'fr' | 'en';

const ALPHABET = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
const LANG_STORAGE_KEY = 'annuaire-lang';

// ─────────────────────────────────────────────────────────────
// Traductions (FR / EN)
// ─────────────────────────────────────────────────────────────

interface Dict {
  locale: string;
  langName: string;

  tabDirectory: string;
  tabOrg: string;
  tabAbout: string;

  title: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearch: string;
  refresh: string;
  language: string;
  print: string;
  exportCsv: string;
  resetFilters: string;
  viewGrid: string;
  viewList: string;
  viewExpand: string;
  filtersBtn: string;

  filterAdd: string;
  filterEmpty: string;
  filterClear: string;
  filterAria: string;

  sitesLabel: string;
  allSites: string;

  emptyTitle: string;
  emptyText: string;
  emptyReset: string;

  alphabetAria: string;
  letterAll: string;
  letterAllTitle: string;
  letterTitle: (letter: string) => string;

  notifFiltersReset: string;
  notifRefreshDone: (count: number) => string;
  notifRefreshError: string;
  notifLangChanged: (name: string) => string;
  notifExportDone: (count: number) => string;
  notifNothingToExport: string;
  notifNothingToPrint: string;

  fSite: string;
  fRole: string;
  fStatus: string;
  fBadge: string;
  fSkills: string;
  stAvailable: string;
  stBusy: string;
  stMeeting: string;
  stAway: string;
  bAdmin: string;
  bHr: string;

  colName: string;
  colRole: string;
  colSite: string;
  colExt: string;
  colPhone: string;
  colEmail: string;
  colStatus: string;

  orgTitle: string;
  orgSubtitle: string;
  orgTop: string;
  orgDG: string;
  orgDGSub: string;
  orgMembers: (count: number) => string;
  orgViewAll: (count: number) => string;

  aboutTitle: string;
  aboutP1: string;
  aboutSyncTitle: string;
  aboutSyncText: string;
  aboutP3: string;

  printTitle: string;
  printGenerated: (date: string) => string;
  printCount: (count: number) => string;
  printCriteria: string;
  printCritSite: (name: string) => string;
  printCritLetter: (letter: string) => string;
  printCritSearch: (query: string) => string;
  printCritAdvanced: (count: number) => string;
}

const FR: Dict = {
  locale: 'fr-FR',
  langName: 'Français',

  tabDirectory: 'Annuaire des Collaborateurs',
  tabOrg: 'Organigramme institutionnel',
  tabAbout: 'À propos',

  title: 'Annuaire Collaborateurs',
  searchPlaceholder: 'Rechercher un collaborateur, un poste, un site, une compétence...',
  searchAria: "Rechercher dans l'annuaire",
  clearSearch: 'Effacer la recherche',
  refresh: 'Actualiser la liste',
  language: 'Langue du portail',
  print: "Imprimer l'annuaire",
  exportCsv: 'Exporter au format Excel / CSV',
  resetFilters: 'Effacer tous les filtres',
  viewGrid: 'Affichage en Grille de cartes',
  viewList: 'Affichage en Liste',
  viewExpand: 'Affichage Dépliable (Galerie)',
  filtersBtn: 'Filtres',

  filterAdd: 'Filtrer',
  filterEmpty: 'Ajouter un filtre (Site, Poste, Statut...)',
  filterClear: 'Effacer les filtres',
  filterAria: "Filtrer les collaborateurs de l'annuaire",

  sitesLabel: 'Sites :',
  allSites: 'Tous les sites',

  emptyTitle: 'Aucun collaborateur ne correspond à ces critères',
  emptyText:
    "Vérifiez l'orthographe du nom, la lettre sélectionnée ou retirez certains filtres pour élargir la recherche.",
  emptyReset: 'Réinitialiser les filtres',

  alphabetAria: 'Filtre alphabétique vertical',
  letterAll: 'Tous',
  letterAllTitle: 'Afficher toutes les initiales',
  letterTitle: (l) => `Filtrer par l'initiale ${l}`,

  notifFiltersReset: 'Tous les filtres ont été réinitialisés',
  notifRefreshDone: (n) => `Liste actualisée : ${n} collaborateur${n > 1 ? 's' : ''}`,
  notifRefreshError: "Échec de l'actualisation de l'annuaire",
  notifLangChanged: (name) => `Langue active : ${name}`,
  notifExportDone: (n) => `Export de ${n} fiche${n > 1 ? 's' : ''} collaborateur${n > 1 ? 's' : ''} généré`,
  notifNothingToExport: 'Aucun collaborateur à exporter avec les filtres actuels',
  notifNothingToPrint: 'Aucun collaborateur à imprimer avec les filtres actuels',

  fSite: 'Site (Location)',
  fRole: 'Poste / Titre',
  fStatus: 'Statut de présence',
  fBadge: 'Distinction / Rôle',
  fSkills: 'Compétence',
  stAvailable: 'En ligne (Disponible)',
  stBusy: 'Occupé',
  stMeeting: 'En réunion',
  stAway: 'En déplacement',
  bAdmin: 'Administrateur',
  bHr: 'Ressources Humaines',

  colName: 'Nom Complet',
  colRole: 'Rôle / Poste',
  colSite: 'Site (Location)',
  colExt: 'Poste Fixe',
  colPhone: 'Téléphone',
  colEmail: 'Email',
  colStatus: 'Statut',

  orgTitle: "Organigramme Institutionnel de l'Entreprise",
  orgSubtitle: 'Structure des délégations régionales et affectations directes par Sites.',
  orgTop: 'Sommet Hiérarchique',
  orgDG: 'Direction Générale',
  orgDGSub: 'Gouvernance Stratégique & Arbitrages',
  orgMembers: (n) => `${n} collaborateur${n > 1 ? 's' : ''} affecté${n > 1 ? 's' : ''}`,
  orgViewAll: (n) => `Voir les ${n} collaborateurs`,

  aboutTitle: "À propos de l'Annuaire du Personnel",
  aboutP1:
    "L'Annuaire du Personnel rassemble l'ensemble des agents, directeurs, ingénieurs et collaborateurs répartis sur tous nos sites géographiques et organisationnels.",
  aboutSyncTitle: 'Synchronisation des coordonnées',
  aboutSyncText:
    "Les numéros de postes internes fixes, coordonnées directes, emails et affectations de sites sont automatiquement synchronisés avec le référentiel d'entreprise.",
  aboutP3:
    "Vous pouvez exporter n'importe quelle fiche contact sous format standard vCard (.vcf) compatible avec vos clients de messagerie et smartphones en scannant le QR code dédié.",

  printTitle: 'Annuaire du Personnel',
  printGenerated: (date) => `Généré le ${date}`,
  printCount: (n) => `${n} collaborateur${n > 1 ? 's' : ''}`,
  printCriteria: 'Critères',
  printCritSite: (name) => `Site : ${name}`,
  printCritLetter: (l) => `Initiale : ${l}`,
  printCritSearch: (q) => `Recherche : « ${q} »`,
  printCritAdvanced: (n) => `${n} filtre${n > 1 ? 's' : ''} avancé${n > 1 ? 's' : ''}`,
};

const EN: Dict = {
  locale: 'en-GB',
  langName: 'English',

  tabDirectory: 'Staff Directory',
  tabOrg: 'Organization Chart',
  tabAbout: 'About',

  title: 'Staff Directory',
  searchPlaceholder: 'Search for a colleague, a job title, a site, a skill...',
  searchAria: 'Search the directory',
  clearSearch: 'Clear search',
  refresh: 'Refresh list',
  language: 'Portal language',
  print: 'Print the directory',
  exportCsv: 'Export as Excel / CSV',
  resetFilters: 'Clear all filters',
  viewGrid: 'Card grid view',
  viewList: 'List view',
  viewExpand: 'Expandable Gallery view',
  filtersBtn: 'Filters',

  filterAdd: 'Filter',
  filterEmpty: 'Add a filter (Site, Role, Status...)',
  filterClear: 'Clear filters',
  filterAria: 'Filter the directory members',

  sitesLabel: 'Sites:',
  allSites: 'All sites',

  emptyTitle: 'No colleague matches these criteria',
  emptyText: 'Check the spelling of the name, the selected letter, or remove some filters to widen the search.',
  emptyReset: 'Reset filters',

  alphabetAria: 'Vertical alphabetical filter',
  letterAll: 'All',
  letterAllTitle: 'Show all initials',
  letterTitle: (l) => `Filter by initial ${l}`,

  notifFiltersReset: 'All filters have been reset',
  notifRefreshDone: (n) => `List refreshed: ${n} colleague${n > 1 ? 's' : ''}`,
  notifRefreshError: 'Failed to refresh the directory',
  notifLangChanged: (name) => `Active language: ${name}`,
  notifExportDone: (n) => `Export of ${n} colleague record${n > 1 ? 's' : ''} generated`,
  notifNothingToExport: 'No colleague to export with the current filters',
  notifNothingToPrint: 'No colleague to print with the current filters',

  fSite: 'Site (Location)',
  fRole: 'Job title',
  fStatus: 'Presence status',
  fBadge: 'Distinction / Role',
  fSkills: 'Skill',
  stAvailable: 'Online (Available)',
  stBusy: 'Busy',
  stMeeting: 'In a meeting',
  stAway: 'Away / travelling',
  bAdmin: 'Administrator',
  bHr: 'Human Resources',

  colName: 'Full name',
  colRole: 'Role / Job title',
  colSite: 'Site (Location)',
  colExt: 'Desk extension',
  colPhone: 'Phone',
  colEmail: 'Email',
  colStatus: 'Status',

  orgTitle: 'Institutional Organization Chart',
  orgSubtitle: 'Structure of regional delegations and direct assignments by Site.',
  orgTop: 'Top of the hierarchy',
  orgDG: 'General Management',
  orgDGSub: 'Strategic governance & arbitration',
  orgMembers: (n) => `${n} colleague${n > 1 ? 's' : ''} assigned`,
  orgViewAll: (n) => `View all ${n} colleagues`,

  aboutTitle: 'About the Staff Directory',
  aboutP1:
    'The Staff Directory brings together all agents, directors, engineers and colleagues across every geographic and organizational site.',
  aboutSyncTitle: 'Contact details synchronization',
  aboutSyncText:
    'Internal desk extensions, direct contact details, emails and site assignments are automatically synchronized with the company repository.',
  aboutP3:
    'You can export any contact card in the standard vCard (.vcf) format, compatible with your email clients and smartphones, by scanning the dedicated QR code.',

  printTitle: 'Staff Directory',
  printGenerated: (date) => `Generated on ${date}`,
  printCount: (n) => `${n} colleague${n > 1 ? 's' : ''}`,
  printCriteria: 'Criteria',
  printCritSite: (name) => `Site: ${name}`,
  printCritLetter: (l) => `Initial: ${l}`,
  printCritSearch: (q) => `Search: "${q}"`,
  printCritAdvanced: (n) => `${n} advanced filter${n > 1 ? 's' : ''}`,
};

const I18N: Record<Lang, Dict> = { fr: FR, en: EN };

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Minuscules + suppression des accents (é → e) pour une recherche tolérante. */
const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Initiale normalisée en majuscule (É → E). */
const initialOf = (value: string): string => normalizeText(value).charAt(0).toUpperCase();

/** Partie « nom du site » avant le séparateur « • ». */
const siteKey = (name: string): string => name.split('•')[0].trim().toLowerCase();

/**
 * Appartenance d'un collaborateur à un site.
 * Correspondance exacte prioritaire, sinon correspondance sur la partie avant « • ».
 */
const employeeInSite = (emp: DirectoryEmployee, site: DirectorySite): boolean => {
  if (emp.site === site.name) return true;
  if (DIRECTORY_SITES.some((s) => s.name === emp.site)) return false;
  return emp.site.toLowerCase().includes(siteKey(site.name));
};

/** Nom canonique du site d'un collaborateur (celui utilisé par les options du FilterBar). */
const canonicalSiteName = (emp: DirectoryEmployee): string =>
  DIRECTORY_SITES.find((s) => employeeInSite(emp, s))?.name ?? emp.site;

/** Échappement d'une cellule CSV. */
const csvCell = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** Schéma de filtres du FilterBar, traduit selon la langue active. */
const buildFilterSchema = (t: Dict): FilterSchema => ({
  fields: [
    {
      id: 'site',
      label: t.fSite,
      type: 'select',
      icon: <MapPin className="w-3.5 h-3.5" />,
      options: DIRECTORY_SITES.map((s) => ({
        value: s.name,
        label: s.name,
      })),
    },
    {
      id: 'role',
      label: t.fRole,
      type: 'text',
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
    {
      id: 'status',
      label: t.fStatus,
      type: 'select',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      options: [
        { value: 'available', label: t.stAvailable },
        { value: 'busy', label: t.stBusy },
        { value: 'meeting', label: t.stMeeting },
        { value: 'away', label: t.stAway },
      ],
    },
    {
      id: 'badge',
      label: t.fBadge,
      type: 'select',
      icon: <Award className="w-3.5 h-3.5" />,
      options: [
        { value: 'MVP', label: 'MVP' },
        { value: 'Business Lead', label: 'Business Lead' },
        { value: 'Admin', label: t.bAdmin },
        { value: 'Tech Lead', label: 'Tech Lead' },
        { value: 'HR', label: t.bHr },
      ],
    },
    {
      id: 'skills',
      label: t.fSkills,
      type: 'text',
      icon: <TagIcon className="w-3.5 h-3.5" />,
    },
  ],
});

// Schéma de référence exporté (version française, rétro-compatible)
export const DIRECTORY_FILTER_SCHEMA: FilterSchema = buildFilterSchema(FR);

function getDirectoryEmployeeFieldValue(employee: DirectoryEmployee, fieldId: string): unknown {
  switch (fieldId) {
    case 'site':
      return canonicalSiteName(employee);
    case 'role':
      return employee.role;
    case 'status':
      return employee.status;
    case 'badge':
      return employee.badge ?? '';
    case 'skills':
      return employee.skills ?? [];
    default:
      return undefined;
  }
}

// ─────────────────────────────────────────────────────────────
// Hauteur explicite pour les zones scrollables
//
// Le scroll interne exige une hauteur bornée sur toute la chaîne des parents
// (TabbedViewLayout → TabsContent → ...). Si un maillon n'a pas de hauteur
// définie, la zone s'agrandit avec son contenu, ne déborde jamais, et le
// parent qui rogne (overflow-hidden) coupe la liste sans permettre de scroller.
//
// Ce hook mesure l'espace réellement visible sous l'élément (en tenant compte
// de tous les ancêtres qui rognent) et lui applique une hauteur en pixels.
// Il se recalcule au redimensionnement de la fenêtre et quand on l'appelle.
// ─────────────────────────────────────────────────────────────

function useFillHeight<T extends HTMLElement>() {
  const nodeRef = useRef<T | null>(null);
  const rafRef = useRef<number>(0);

  const measure = useCallback(() => {
    const node = nodeRef.current;
    if (!node || !node.isConnected) return;

    // 1) Hauteur volontairement exagérée : les ancêtres qui rognent vraiment
    //    le contenu deviennent détectables (scrollHeight > clientHeight).
    node.style.flex = '0 0 auto';
    node.style.height = `${window.innerHeight * 2}px`;

    // 2) Limite basse visible = la plus proche entre le bas du viewport
    //    et le bas de chaque ancêtre qui rogne (padding et bordure déduits).
    let limit = window.innerHeight;
    let parent = node.parentElement;
    while (parent && parent !== document.documentElement) {
      const cs = window.getComputedStyle(parent);
      if (cs.overflowY !== 'visible' && parent.scrollHeight > parent.clientHeight + 1) {
        const bottom =
          parent.getBoundingClientRect().bottom -
          (parseFloat(cs.borderBottomWidth) || 0) -
          (parseFloat(cs.paddingBottom) || 0);
        limit = Math.min(limit, bottom);
      }
      parent = parent.parentElement;
    }

    // 3) Hauteur finale = espace restant entre le haut de l'élément et cette limite.
    const top = node.getBoundingClientRect().top;
    node.style.height = `${Math.max(120, Math.floor(limit - top))}px`;
  }, []);

  const schedule = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(measure);
  }, [measure]);

  // Ref à placer sur l'élément : mesure au montage puis après les animations d'entrée
  const ref = useCallback(
    (node: T | null) => {
      nodeRef.current = node;
      if (!node) return;
      schedule();
      window.setTimeout(measure, 150);
      window.setTimeout(measure, 500);
    },
    [measure, schedule]
  );

  useEffect(() => {
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      viewport?.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [schedule]);

  return { ref, remeasure: schedule };
}

// ─────────────────────────────────────────────────────────────
// Pilule de site (indicateur actif animé)
// ─────────────────────────────────────────────────────────────

interface SitePillProps {
  key?: React.Key;
  active: boolean;
  onClick: () => void;
  reduceMotion: boolean;
  children: React.ReactNode;
}

function SitePill({ active, onClick, reduceMotion, children }: SitePillProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      className={`relative shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 ${
        active
          ? 'border-transparent font-bold text-slate-950'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      }`}
    >
      {active && (
        <motion.span
          layoutId="directory-site-pill"
          className="absolute inset-0 rounded-full bg-teal-500 shadow-md shadow-teal-500/20"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 460, damping: 34 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// Feuille d'impression (rendue dans <body> via un portail)
// Nécessaire car la page utilise des scrolls internes : window.print() seul
// n'imprimerait que la partie visible à l'écran.
// ─────────────────────────────────────────────────────────────

const PRINT_CSS = `
  @page { size: A4 landscape; margin: 12mm; }
  #annuaire-print-root { display: none; }
  @media print {
    html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
    body > *:not(#annuaire-print-root) { display: none !important; }
    #annuaire-print-root { display: block !important; color: #111; background: #fff; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; }
    #annuaire-print-root h1 { font-size: 18px; margin: 0 0 4px; }
    #annuaire-print-root p { margin: 0 0 4px; color: #444; }
    #annuaire-print-root table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    #annuaire-print-root thead { display: table-header-group; }
    #annuaire-print-root tr { break-inside: avoid; page-break-inside: avoid; }
    #annuaire-print-root th, #annuaire-print-root td { border-bottom: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
    #annuaire-print-root th { border-bottom: 2px solid #111; font-weight: 700; }
  }
`;

interface PrintSheetProps {
  employees: DirectoryEmployee[];
  criteria: string[];
  t: Dict;
}

function PrintSheet({ employees, criteria, t }: PrintSheetProps) {
  const date = new Date().toLocaleDateString(t.locale, { day: '2-digit', month: 'long', year: 'numeric' });

  return createPortal(
    <div id="annuaire-print-root">
      <style>{PRINT_CSS}</style>
      <h1>{t.printTitle}</h1>
      <p>
        {t.printGenerated(date)} — {t.printCount(employees.length)}
      </p>
      {criteria.length > 0 && (
        <p>
          {t.printCriteria} : {criteria.join(' · ')}
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>{t.colName}</th>
            <th>{t.colRole}</th>
            <th>{t.colSite}</th>
            <th>{t.colExt}</th>
            <th>{t.colPhone}</th>
            <th>{t.colEmail}</th>
            <th>{t.colStatus}</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id}>
              <td>{e.fullName}</td>
              <td>{e.role}</td>
              <td>{e.site}</td>
              <td>{e.extension}</td>
              <td>{e.phone}</td>
              <td>{e.email}</td>
              <td>{e.statusLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export function AnnuairePage({
  onShowNotification,
  employees: employeesProp,
  onRefresh,
}: AnnuairePageProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const employees = employeesProp ?? DIRECTORY_EMPLOYEES;

  // Langue du portail (persistée)
  const [lang, setLang] = useState<Lang>('fr');
  const t = I18N[lang];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'fr' || saved === 'en') setLang(saved);
    } catch {
      // Stockage local indisponible : on garde la langue par défaut
    }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = useCallback((): 'directory' | 'org' | 'about' => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/organigramme') || path.includes('/org')) return 'org';
    if (path.includes('/structures') || path.includes('/about')) return 'about';
    return 'directory';
  }, [location.pathname]);

  // Navigation par tabs synchronisée avec l'URL (comme Agenda, News et Sites)
  const [activeTab, setActiveTab] = useState<'directory' | 'org' | 'about'>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [getTabFromPath]);

  const handleTabChange = (val: 'directory' | 'org' | 'about') => {
    playXboxSound('select');
    setActiveTab(val);
    const targetRoute = val === 'org' ? '/annuaire/organigramme' : val === 'about' ? '/annuaire/structures' : '/annuaire/contacts';
    navigate(targetRoute);
  };

  const tabsOptions = [
    { id: 'directory' as const, label: t.tabDirectory, icon: <Users className="w-4 h-4" /> },
    { id: 'org' as const, label: t.tabOrg, icon: <Network className="w-4 h-4" /> },
    { id: 'about' as const, label: t.tabAbout, icon: <Info className="w-4 h-4" /> },
  ];

  // Filtre rapide par Site (Location)
  const [selectedSitePill, setSelectedSitePill] = useState<string>('all');

  // Filtre alphabétique vertical
  const [selectedLetter, setSelectedLetter] = useState<string>('All');

  // Barre de recherche libre
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtres issus du composant de référence FilterBar (schéma traduit)
  const filterSchema = useMemo(() => buildFilterSchema(t), [t]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const { fields, onChange: onFiltersChange } = useFilterSchema(filterSchema, filters, setFilters);

  // Affichage de la FilterBar sur mobile (toujours visible à partir de md)
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Mode d'affichage : Grille de cartes, Liste, ou Dépliable (Galerie)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'expand'>('grid');

  // Collaborateur sélectionné pour la modale
  const [selectedEmployee, setSelectedEmployee] = useState<DirectoryEmployee | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Actualisation
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Impression
  const [showPrintSheet, setShowPrintSheet] = useState<boolean>(false);
  const [printRequest, setPrintRequest] = useState<number>(0);

  // Conteneur scrollable indépendant de la grille / liste
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hauteurs explicites des zones scrollables (voir useFillHeight)
  const dirFill = useFillHeight<HTMLDivElement>();
  const orgFill = useFillHeight<HTMLDivElement>();
  const aboutFill = useFillHeight<HTMLDivElement>();

  // Quand l'en-tête change de taille (filtres ajoutés, ligne qui passe à la ligne,
  // bouton Filtres mobile...), la zone scrollable est recalculée.
  const headerObserver = useRef<ResizeObserver | null>(null);
  const { remeasure: remeasureDirectory } = dirFill;
  const setHeaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      headerObserver.current?.disconnect();
      headerObserver.current = null;
      if (node && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => remeasureDirectory());
        observer.observe(node);
        headerObserver.current = observer;
      }
    },
    [remeasureDirectory]
  );

  // Index de recherche (recalculé uniquement si les données changent)
  const index = useMemo(
    () =>
      employees.map((emp) => ({
        emp,
        haystack: normalizeText(
          [emp.fullName, emp.role, emp.site, emp.extension, emp.phone, emp.email, ...(emp.skills ?? [])]
            .filter(Boolean)
            .join(' ')
        ),
        initials: new Set([initialOf(emp.lastName), initialOf(emp.firstName)]),
      })),
    [employees]
  );

  // Lettres pour lesquelles il existe au moins un collaborateur
  const availableLetters = useMemo(
    () => new Set<string>(index.flatMap((item) => Array.from(item.initials))),
    [index]
  );

  // Nombre de collaborateurs par site
  const siteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DIRECTORY_SITES.forEach((site) => {
      counts[site.id] = employees.filter((e) => employeeInSite(e, site)).length;
    });
    return counts;
  }, [employees]);

  // Filtrage combiné : Recherche libre + Pilules Sites + Alphabétique + FilterBar
  const filteredEmployees = useMemo(() => {
    const tokens = normalizeText(searchQuery).split(/\s+/).filter(Boolean);
    const activeSite =
      selectedSitePill === 'all' ? null : DIRECTORY_SITES.find((s) => s.id === selectedSitePill) ?? null;

    return index
      .filter(({ emp, haystack, initials }) => {
        // 1. Filtre par Site via pilules rapides
        if (activeSite && !employeeInSite(emp, activeSite)) return false;

        // 2. Filtre alphabétique A-Z (initiale du nom OU du prénom)
        if (selectedLetter !== 'All' && !initials.has(selectedLetter)) return false;

        // 3. Recherche plein texte (tous les mots saisis doivent correspondre, accents ignorés)
        if (tokens.length > 0 && !tokens.every((tok) => haystack.includes(tok))) return false;

        // 4. Évaluation du composant de filtre de référence (FilterBar)
        return matchesFilters(emp, filters, filterSchema, getDirectoryEmployeeFieldValue);
      })
      .map(({ emp }) => emp);
  }, [index, selectedSitePill, selectedLetter, searchQuery, filters, filterSchema]);

  // Transformation des données pour le composant ClickExpandGallery
  const expandItems = useMemo<ClickExpandItem<DirectoryEmployee>[]>(() => {
    return filteredEmployees.map((emp) => {
      let tone: ClickExpandTone = 'neutral';
      if (emp.status === 'available') tone = 'success';
      else if (emp.status === 'busy') tone = 'danger';
      else if (emp.status === 'meeting') tone = 'warning';
      else if (emp.status === 'away') tone = 'info';

      const empUuid = emp.uuid || getEmployeeUuid(emp);

      return {
        id: emp.id,
        title: emp.fullName,
        subtitle: emp.role,
        image: emp.avatar,
        imageAlt: `Photo de ${emp.fullName}`,
        status: {
          label:
            emp.statusLabel ||
            (emp.status === 'available'
              ? t.stAvailable
              : emp.status === 'busy'
              ? t.stBusy
              : emp.status === 'meeting'
              ? t.stMeeting
              : emp.status === 'away'
              ? t.stAway
              : 'En ligne'),
          tone,
        },
        chips: [
          ...(emp.badge ? [{ label: emp.badge, tone: 'accent' as const, icon: <Award className="w-3 h-3" /> }] : []),
          ...(emp.department ? [{ label: emp.department, tone: 'neutral' as const, icon: <Briefcase className="w-3 h-3" /> }] : []),
          ...(emp.extension ? [{ label: `${t.colExt} : ${emp.extension}`, tone: 'neutral' as const }] : []),
        ],
        details: [
          { id: 'site', label: t.fSite, value: emp.site, icon: <MapPin className="w-3.5 h-3.5" /> },
          { id: 'phone', label: t.colPhone, value: emp.phone, href: `tel:${emp.phone}`, icon: <Phone className="w-3.5 h-3.5" /> },
          { id: 'email', label: t.colEmail, value: emp.email, href: `mailto:${emp.email}`, icon: <Mail className="w-3.5 h-3.5" /> },
          { id: 'uuid', label: 'Matricule / UUID', value: `#${empUuid}`, icon: <UserCheck className="w-3.5 h-3.5" /> },
          ...(emp.manager ? [{ id: 'manager', label: 'Responsable', value: emp.manager, icon: <Users className="w-3.5 h-3.5" /> }] : []),
        ],
        tags: emp.skills,
        actions: [
          {
            id: 'open-profile',
            label: 'Fiche profil',
            variant: 'primary',
            icon: <ArrowRight className="w-3.5 h-3.5" />,
            onClick: (e) => {
              e.stopPropagation();
              playXboxSound('select');
              navigate(`/annuaire/${empUuid}/review`);
            },
          },
          {
            id: 'open-modal',
            label: 'Aperçu',
            variant: 'secondary',
            icon: <ExternalLink className="w-3.5 h-3.5" />,
            onClick: (e) => {
              e.stopPropagation();
              openEmployee(emp, false);
            },
          },
          {
            id: 'open-qr',
            label: 'QR vCard',
            variant: 'secondary',
            icon: <QrCode className="w-3.5 h-3.5" />,
            onClick: (e) => {
              e.stopPropagation();
              openEmployee(emp, true);
            },
          },
        ],
        data: emp,
      };
    });
  }, [filteredEmployees, t, navigate]);

  // Critères actifs (affichés en tête de la feuille d'impression)
  const printCriteria = useMemo(() => {
    const criteria: string[] = [];
    const site = DIRECTORY_SITES.find((s) => s.id === selectedSitePill);
    if (site) criteria.push(t.printCritSite(site.name));
    if (selectedLetter !== 'All') criteria.push(t.printCritLetter(selectedLetter));
    if (searchQuery.trim()) criteria.push(t.printCritSearch(searchQuery.trim()));
    if (filters.length > 0) criteria.push(t.printCritAdvanced(filters.length));
    return criteria;
  }, [selectedSitePill, selectedLetter, searchQuery, filters, t]);

  // Retour en haut de la liste dès que les critères changent
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [selectedSitePill, selectedLetter, searchQuery, filters, viewMode, reduceMotion]);

  // Lance l'impression une fois la feuille montée dans le DOM
  useEffect(() => {
    if (printRequest === 0) return;
    const id = window.requestAnimationFrame(() => window.print());
    return () => window.cancelAnimationFrame(id);
  }, [printRequest]);

  // Nettoie la feuille d'impression après l'impression / l'annulation
  useEffect(() => {
    const done = () => setShowPrintSheet(false);
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  // Réinitialiser tous les filtres
  const handleResetFilters = () => {
    playXboxSound('back');
    setSelectedSitePill('all');
    setSelectedLetter('All');
    setSearchQuery('');
    setFilters([]);
    onShowNotification?.(t.notifFiltersReset, 'info');
  };

  // Actualisation : appelle onRefresh si fourni, sinon rafraîchit l'affichage
  const handleRefresh = async () => {
    if (isRefreshing) return;
    playXboxSound('select');
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        scrollRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      onShowNotification?.(t.notifRefreshDone(employees.length), 'success');
    } catch {
      onShowNotification?.(t.notifRefreshError, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Bascule de langue FR ↔ EN (persistée)
  const handleToggleLang = () => {
    playXboxSound('select');
    const next: Lang = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Stockage local indisponible : la langue ne sera pas mémorisée
    }
    onShowNotification?.(I18N[next].notifLangChanged(I18N[next].langName), 'info');
  };

  // Export CSV (séparateur « ; » pour une ouverture directe dans Excel en français)
  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      onShowNotification?.(t.notifNothingToExport, 'warning');
      return;
    }
    playXboxSound('achievement');
    const headers = [t.colName, t.colRole, t.colSite, t.colExt, t.colPhone, t.colEmail, t.colStatus];
    const rows = filteredEmployees.map((e) => [
      e.fullName,
      e.role,
      e.site,
      e.extension,
      e.phone,
      e.email,
      e.statusLabel,
    ]);

    const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Annuaire_Personnel_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowNotification?.(t.notifExportDone(filteredEmployees.length), 'success');
  };

  // Impression de la liste filtrée complète (pas seulement la partie visible)
  const handlePrint = () => {
    if (filteredEmployees.length === 0) {
      onShowNotification?.(t.notifNothingToPrint, 'warning');
      return;
    }
    playXboxSound('select');
    setShowPrintSheet(true);
    setPrintRequest((n) => n + 1);
  };

  const openEmployee = (employee: DirectoryEmployee, withQr = false) => {
    setSelectedEmployee(employee);
    setShowQrModal(withQr);
  };

  // Depuis l'organigramme : ouvre l'annuaire filtré sur un site
  const goToSite = (site: DirectorySite) => {
    playXboxSound('select');
    setSelectedSitePill(site.id);
    setSelectedLetter('All');
    setSearchQuery('');
    setFilters([]);
    handleTabChange('directory');
  };

  // ── Animations (désactivées si l'utilisateur préfère réduire les mouvements) ──
  const viewAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      };

  const cardAnim = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14, scale: 0.98 },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.28, ease: 'easeOut' as const, delay: Math.min(i, 12) * 0.03 },
          },
          whileHover: { y: -3, transition: { duration: 0.15 } },
        };

  const toolBtn =
    'shrink-0 rounded-lg p-2 sm:p-1.5 transition-colors active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60';

  return (
    <div lang={lang} className="w-full h-full min-h-full flex-1 flex flex-col bg-transparent relative overflow-hidden">
      {/* ── ARRIÈRE-PLAN DE L'ANNUAIRE (FLOUTÉ AVEC DOUCEUR, SANS VOILE NOIR) ── */}
      <PageBackground
        imageSrc={annuaireBg}
        imageAlt="Annuaire Collaborateurs"
        imageFit="cover"
        showAtmosphere={false}
        showDarkWash={false}
        showGlow={false}
        className="opacity-100 bg-transparent"
        imageClassName="opacity-100 blur-[12px] scale-110"
      />

      {/* ── UTILISATION DU LAYOUT TABBED IDENTIQUE À AGENDA ET NEWS ── */}
      <TabbedViewLayout
        activeTab={activeTab}
        onTabChange={(val) => handleTabChange(val as 'directory' | 'org' | 'about')}
        tabs={tabsOptions}
        containerClassName="h-[calc(100vh-115px)] supports-[height:100dvh]:h-[calc(100dvh-115px)] my-0 px-3 sm:px-6 lg:px-8 py-2 relative z-10"
        mainClassName="overflow-hidden flex flex-col h-full min-h-0"
      >
        {/* ── TAB 1 : ANNUAIRE DES COLLABORATEURS ── */}
        <TabsContent value="directory" className="flex-1 min-h-0 h-full flex flex-col overflow-hidden text-slate-100">

          {/* ── PARTIE HAUTE FIXE (TITRE, RECHERCHE, FILTERBAR, PILULES SITES) ── */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            ref={setHeaderRef}
            className="relative z-20 shrink-0 flex flex-col gap-2 sm:gap-2.5 pb-2.5 border-b border-white/10 select-none"
          >

            {/* Ligne 1 : Recherche (déplacée à la place du titre) avec largeur réduite + Outils d'action rapides */}
            <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {/* Côté Gauche : Champ de recherche compact + bouton Filtres (mobile) */}
              <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                <div className="relative group w-full sm:w-64 md:w-80 lg:w-96 max-w-md shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && searchQuery) setSearchQuery('');
                    }}
                    aria-label={t.searchAria}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-9 py-1.5 sm:py-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-900/90 border border-white/15 focus:border-teal-400/80 text-white placeholder-slate-400 text-xs sm:text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400/20 backdrop-blur-md transition-all truncate"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        key="clear-search"
                        type="button"
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.12 }}
                        onClick={() => {
                          playXboxSound('select');
                          setSearchQuery('');
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={t.clearSearch}
                        aria-label={t.clearSearch}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bouton Filtres : uniquement sur petits écrans */}
                <button
                  type="button"
                  onClick={() => {
                    playXboxSound('select');
                    setShowFilters((v) => !v);
                  }}
                  aria-expanded={showFilters}
                  aria-controls="directory-filterbar"
                  className={`md:hidden shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 ${
                    showFilters || filters.length > 0
                      ? 'border-teal-400/60 bg-teal-500/20 text-teal-200'
                      : 'border-white/15 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{t.filtersBtn}</span>
                  {filters.length > 0 && (
                    <span className="min-w-[1.1rem] rounded-full bg-teal-500 px-1 text-center text-[10px] font-black leading-[1.1rem] text-slate-950">
                      {filters.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Outils d'actions rapides et bascule de vue */}
              <div className="flex max-w-full items-center gap-1 sm:gap-1.5 self-end sm:self-auto overflow-x-auto scrollbar-none">
                <motion.span
                  key={filteredEmployees.length}
                  initial={reduceMotion ? false : { scale: 1.18, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  aria-live="polite"
                  className="shrink-0 text-xs font-mono font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20"
                >
                  {filteredEmployees.length} / {employees.length}
                </motion.span>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`${toolBtn} text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-60`}
                  title={t.refresh}
                  aria-label={t.refresh}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleToggleLang}
                  className={`${toolBtn} flex items-center gap-1 text-slate-300 hover:text-white hover:bg-white/10`}
                  title={`${t.language} (${lang.toUpperCase()})`}
                  aria-label={`${t.language} (${lang.toUpperCase()})`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] font-bold leading-none">{lang.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className={`${toolBtn} text-slate-400 hover:text-white hover:bg-white/10`}
                  title={t.print}
                  aria-label={t.print}
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className={`${toolBtn} text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10`}
                  title={t.exportCsv}
                  aria-label={t.exportCsv}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={`${toolBtn} text-slate-400 hover:text-rose-400 hover:bg-rose-500/10`}
                  title={t.resetFilters}
                  aria-label={t.resetFilters}
                >
                  <FilterX className="w-4 h-4" />
                </button>

                {/* Bascule Grille / Liste / Dépliable (Galerie) */}
                <div className="shrink-0 flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => {
                      playXboxSound('select');
                      setViewMode('grid');
                    }}
                    aria-pressed={viewMode === 'grid'}
                    className={`rounded p-1.5 sm:p-1 transition-colors ${viewMode === 'grid' ? 'bg-teal-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    title={t.viewGrid}
                    aria-label={t.viewGrid}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playXboxSound('select');
                      setViewMode('list');
                    }}
                    aria-pressed={viewMode === 'list'}
                    className={`rounded p-1.5 sm:p-1 transition-colors ${viewMode === 'list' ? 'bg-teal-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    title={t.viewList}
                    aria-label={t.viewList}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playXboxSound('select');
                      setViewMode('expand');
                    }}
                    aria-pressed={viewMode === 'expand'}
                    className={`rounded p-1.5 sm:p-1 transition-colors ${viewMode === 'expand' ? 'bg-teal-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    title={t.viewExpand}
                    aria-label={t.viewExpand}
                  >
                    <Rows3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ligne 3 : FilterBar (repliable sur mobile, toujours visible dès md) */}
            <div id="directory-filterbar" className={`dark w-full ${showFilters ? 'block' : 'hidden'} md:block`}>
              <motion.div
                key={showFilters ? 'open' : 'closed'}
                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FilterBar
                  fields={fields}
                  value={filters}
                  onChange={onFiltersChange}
                  addLabel={t.filterAdd}
                  emptyLabel={t.filterEmpty}
                  clearLabel={t.filterClear}
                  aria-label={t.filterAria}
                />
              </motion.div>
            </div>

            {/* Ligne 4 : Pilules rapides par Site (Location) */}
            <div className="w-full min-w-0 flex items-center gap-2">
              <div className="flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-teal-400 backdrop-blur-md">
                <MapPin className="w-3 h-3" />
                <span className="hidden sm:inline">{t.sitesLabel}</span>
              </div>

              <div
                className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 scrollbar-none"
                onWheel={(e) => {
                  // Permet de faire défiler les pilules horizontalement avec la molette
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
              >
                <SitePill
                  active={selectedSitePill === 'all'}
                  reduceMotion={reduceMotion}
                  onClick={() => {
                    playXboxSound('select');
                    setSelectedSitePill('all');
                  }}
                >
                  {t.allSites} ({employees.length})
                </SitePill>

                {DIRECTORY_SITES.map((site) => {
                  const isSelected = selectedSitePill === site.id;
                  return (
                    <SitePill
                      key={site.id}
                      active={isSelected}
                      reduceMotion={reduceMotion}
                      onClick={() => {
                        playXboxSound('select');
                        setSelectedSitePill(site.id);
                      }}
                    >
                      <MapPin className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-teal-400'}`} />
                      <span>{site.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-px rounded-full font-bold ${
                          isSelected ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {siteCounts[site.id] ?? 0}
                      </span>
                    </SitePill>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── PARTIE BASSE : GRILLE SCROLLABLE + FILTRE ALPHABÉTIQUE, CHACUN AVEC SON SCROLL ── */}
          <div
            ref={dirFill.ref}
            className="flex-1 min-h-0 flex items-stretch gap-2 sm:gap-3 pt-2.5 overflow-hidden relative"
          >

            {/* Zone principale : scroll indépendant (grille de cartes ou liste) */}
            <div
              ref={scrollRef}
              className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth pr-1.5 sm:pr-2 scrollbar-thin scrollbar-thumb-teal-500/30 hover:scrollbar-thumb-teal-400/50"
            >
              <AnimatePresence mode="wait">
                {filteredEmployees.length === 0 ? (
                  <motion.div
                    key="empty"
                    {...viewAnim}
                    className="w-full py-12 sm:py-16 flex flex-col items-center justify-center text-center p-6 sm:p-8"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-slate-400 mb-3 border border-white/10">
                      <FilterX className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-white">{t.emptyTitle}</h3>
                    <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">{t.emptyText}</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.emptyReset}</span>
                    </button>
                  </motion.div>
                ) : viewMode === 'grid' ? (
                  <motion.div
                    key="grid"
                    {...viewAnim}
                    className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3 sm:gap-3.5 pb-8 pt-1.5"
                  >
                    {filteredEmployees.map((emp, i) => (
                      <motion.div key={emp.id} className="min-w-0" {...cardAnim(i)}>
                        <EmployeeCard
                          employee={emp}
                          onSelect={(selected) => openEmployee(selected, false)}
                          onOpenQr={(selected) => openEmployee(selected, true)}
                          onShowNotification={onShowNotification}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : viewMode === 'list' ? (
                  <motion.div key="list" {...viewAnim} className="pb-8 pt-1.5 min-w-0">
                    <EmployeeListView
                      employees={filteredEmployees}
                      onSelect={(selected) => openEmployee(selected, false)}
                      onOpenQr={(selected) => openEmployee(selected, true)}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="expand" {...viewAnim} className="pb-8 pt-1.5 min-w-0">
                    <ClickExpandGallery<DirectoryEmployee>
                      items={expandItems}
                      multiple={false}
                      minItemWidth={280}
                      gap={14}
                      avatarShape="morph"
                      duration={500}
                      labels={{
                        list: t.tabDirectory,
                        open: (item) => `Déplier la fiche de ${item.title}`,
                        close: (item) => `Replier la fiche de ${item.title}`,
                        tags: t.fSkills,
                      }}
                      onOpenChange={(_openIds, { open }) => {
                        if (open) playXboxSound('select');
                        else playXboxSound('toggle');
                      }}
                      empty={
                        <div className="w-full py-12 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <p className="text-sm">{t.emptyTitle}</p>
                        </div>
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── FILTRE ALPHABÉTIQUE VERTICAL : toutes les lettres visibles, scroll si l'écran est trop court ── */}
            <motion.aside
              aria-label={t.alphabetAria}
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="shrink-0 w-10 sm:w-11 h-full max-h-full min-h-0 flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-xl overflow-hidden select-none z-10"
            >
              <div className="flex-1 min-h-0 flex flex-col items-stretch justify-start content-start gap-0.5 sm:gap-1 px-1 py-1.5 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-teal-500/30 hover:scrollbar-thumb-teal-400/50">
                {ALPHABET.map((letter) => {
                  const isAll = letter === 'All';
                  const isSelected = selectedLetter === letter;
                  const isAvailable = isAll || availableLetters.has(letter);
                  return (
                    <motion.button
                      key={letter}
                      type="button"
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      whileHover={reduceMotion || !isAvailable || isSelected ? undefined : { scale: 1.1 }}
                      whileTap={reduceMotion || !isAvailable ? undefined : { scale: 0.9 }}
                      onClick={() => {
                        playXboxSound('select');
                        // Re-cliquer sur la lettre active revient à « Tous »
                        setSelectedLetter((prev) => (prev === letter && !isAll ? 'All' : letter));
                      }}
                      className={`relative flex w-full flex-1 min-h-[22px] max-h-[30px] items-center justify-center rounded-lg font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 ${
                        isAll ? 'text-[9px] tracking-tight' : 'text-[10px] sm:text-[11px]'
                      } ${
                        isSelected
                          ? 'font-black text-slate-950'
                          : isAvailable
                            ? 'cursor-pointer text-slate-400 hover:bg-white/10 hover:text-white'
                            : 'cursor-not-allowed text-slate-600 opacity-40'
                      }`}
                      title={isAll ? t.letterAllTitle : t.letterTitle(letter)}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="directory-letter-active"
                          className="absolute inset-0 rounded-lg bg-teal-500 shadow-md shadow-teal-500/40 ring-1 ring-white/30"
                          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 36 }}
                        />
                      )}
                      <span className="relative z-10">{isAll ? t.letterAll : letter}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.aside>

          </div>

        </TabsContent>

        {/* ── TAB 2 : ORGANIGRAMME INSTITUTIONNEL ── */}
        <TabsContent value="org" className="flex-1 min-h-0 flex flex-col overflow-hidden text-slate-100">
          <div
            ref={orgFill.ref}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-teal-500/20"
          >
          <div className="w-full space-y-6 pt-2 pb-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between pb-3 border-b border-white/10"
            >
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 shrink-0 text-indigo-400" />
                  <span className="truncate">{t.orgTitle}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.orgSubtitle}</p>
              </div>
            </motion.div>

            <div className="space-y-6">
              {/* Sommet Hiérarchique */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/15 text-white shadow-xl text-center max-w-sm w-full backdrop-blur-md"
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">{t.orgTop}</span>
                  <h4 className="font-bold text-sm mt-0.5">{t.orgDG}</h4>
                  <p className="text-xs text-slate-400">{t.orgDGSub}</p>
                </motion.div>
                <motion.div
                  initial={reduceMotion ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.25, delay: 0.2 }}
                  style={{ originY: 0 }}
                  className="w-0.5 h-6 bg-white/20 my-1"
                />
              </div>

              {/* Directions & Sites Opérationnels */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
                {DIRECTORY_SITES.map((site, i) => {
                  const members = employees.filter((e) => employeeInSite(e, site));
                  return (
                    <motion.div
                      key={site.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + Math.min(i, 8) * 0.06 }}
                      className="min-w-0 p-4 rounded-2xl bg-slate-900/60 border border-white/10 shadow-lg flex flex-col justify-between backdrop-blur-md"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-teal-400 mb-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-bold uppercase truncate">{site.name}</span>
                        </div>
                        <p className="text-xs text-slate-400">{t.orgMembers(members.length)}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                        {members.slice(0, 3).map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => openEmployee(m, false)}
                            className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-xs text-slate-300 transition-colors hover:text-teal-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
                          >
                            <img
                              src={m.avatar}
                              alt={m.fullName}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-5 h-5 shrink-0 rounded-full object-cover"
                            />
                            <span className="truncate font-medium">{m.fullName}</span>
                          </button>
                        ))}
                        {members.length > 3 && (
                          <button
                            type="button"
                            onClick={() => goToSite(site)}
                            className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300 hover:bg-teal-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
                          >
                            <span className="truncate">{t.orgViewAll(members.length)}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* ── TAB 3 : À PROPOS ── */}
        <TabsContent value="about" className="flex-1 min-h-0 flex flex-col overflow-hidden text-slate-100">
          <div
            ref={aboutFill.ref}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-teal-500/20"
          >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl pt-2 pb-8 space-y-4"
          >
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 shrink-0 text-teal-400" />
              <span>{t.aboutTitle}</span>
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>{t.aboutP1}</p>
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-200">
                <h4 className="font-bold text-sm mb-1 text-white">{t.aboutSyncTitle}</h4>
                <p>{t.aboutSyncText}</p>
              </div>
              <p>{t.aboutP3}</p>
            </div>
          </motion.div>
          </div>
        </TabsContent>

      </TabbedViewLayout>

      {/* ── MODALE DÉTAILLÉE DU COLLABORATEUR / VCARD & QR CODE ── */}
      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDetailModal
            employee={selectedEmployee}
            initialShowQr={showQrModal}
            onClose={() => {
              setSelectedEmployee(null);
              setShowQrModal(false);
            }}
            onShowNotification={onShowNotification}
          />
        )}
      </AnimatePresence>

      {/* ── FEUILLE D'IMPRESSION (montée uniquement pendant l'impression) ── */}
      {showPrintSheet && (
        <PrintSheet employees={filteredEmployees} criteria={printCriteria} t={t} />
      )}
    </div>
  );
}