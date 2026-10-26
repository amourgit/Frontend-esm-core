import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AnimatedHomeBackground,
  AsyncSelect,
  CalendarIcon,
  CardHeader,
  ClassificationTags,
  ContentSection,
  CustomOverflowMenu,
  CustomOverflowMenuItem,
  DefaultPageBackground,
  DocumentToolbar,
  DocumentIcon,
  EgenDatePicker,
  EgenDateRangePicker,
  EmptyCard,
  EmptyCardIllustration,
  ErrorCard,
  ErrorState,
  FilterBarDemo,
  GradientBlur,
  GradientWave,
  HeroMosaic,
  HomePictogram,
  Icon,
  iconIds,
  NumericDataPoint,
  PageHeader,
  PageHeaderContent,
  Pagination,
  Pictogram,
  pictogramIds,
  ResponsiveWrapper,
  SearchIcon,
  showActionableNotification,
  showNotification,
  showSnackbar,
  showToast,
  SiteActivityPanel,
  SiteApplicationsPanel,
  SiteBanner,
  SiteCarousel,
  SiteMembersPanel,
  SitePanelHeader,
  SiteResourcesPanel,
  SiteSearchBar,
  SiteSettingsPanel,
  SiteTabbedLayout,
  SiteTasksPanel,
  TopBarAvatar,
  TopBarDivider,
  TopBarIconButton,
  UserIcon,
  type HeroTile,
  type SiteActivity,
  type SiteApplication,
  type SiteMember,
  type SiteResource,
  type SiteSettingsValue,
  type SiteSummary,
  type SiteTask,
} from '@egen-civitas/esm-framework';
import styles from './component-showcase.scss';
import { ShowcaseBoundary, Variant } from './new-components-showcase.component';

// =============================================================================
//  Vitrine — composants du styleguide jusque-là absents de la page
//    • Icônes & pictogrammes (registre complet)
//    • Cartes & états : CardHeader, EmptyCard, ErrorState/ErrorCard, ContentSection,
//      ClassificationTags, NumericDataPoint, PageHeader, Pagination, HeroMosaic,
//      CustomOverflowMenu, ResponsiveWrapper
//    • Formulaires & filtres : EgenDatePicker, EgenDateRangePicker, AsyncSelect,
//      FilterBar (démo), DocumentToolbar
//    • Fonds de page : GradientWave, AnimatedHomeBackground, DefaultPageBackground,
//      GradientBlur
//    • Notifications : showNotification, showActionableNotification, showSnackbar
//    • TopBar (primitives) : TopBarIconButton, TopBarAvatar, TopBarDivider
//    • Sites : bannière, recherche, carrousel, onglets et panneaux
//  Aucune image distante : les visuels de démo sont des SVG générés en data-URI.
//  Non présentés ici (dépendent du contexte applicatif — backend, shell, ateliers) :
//  EntityPhoto, EntityBanner*, LocationPicker,
//  Workspace*/ActionMenuButton*, TableBatchActions.
// =============================================================================

/** Image SVG de démo (dégradé + libellé) encodée en data-URI. */
const demoImage = (from: string, to: string, label = ''): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='960' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='960' height='600' fill='url(#g)'/><text x='48' y='552' font-family='sans-serif' font-size='44' fill='white' fill-opacity='0.85'>${label}</text></svg>`,
  )}`;

const DEMO_BACKGROUND = demoImage('#0f766e', '#1e1b4b', 'PageBackground');

const Stage: React.FC<{ children: React.ReactNode; height?: number }> = ({ children, height = 280 }) => (
  <div className={styles.stageBounded} style={{ height }}>
    {children}
  </div>
);

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <p className={styles.sectionDescription}>{description}</p>
    {children}
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Icônes & pictogrammes
// ─────────────────────────────────────────────────────────────────────────────
const IconsShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const icons = useMemo(() => iconIds.filter((id) => id.includes(q)), [q]);
  const pictograms = useMemo(() => pictogramIds.filter((id) => id.includes(q)), [q]);

  return (
    <>
      <Section
        title="Icon"
        description={t(
          'showcaseIconsDescription',
          `Registre complet des icônes (${iconIds.length}) : <Icon icon="egen-icon-…" />. Chaque icône existe aussi en composant nommé (ActivityIcon, CalendarIcon…).`,
        )}
      >
        <div className={styles.controls}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t('showcaseIconsSearch', 'Filtrer les icônes et pictogrammes…')}
            aria-label={t('showcaseIconsSearch', 'Filtrer les icônes et pictogrammes…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.iconGrid}>
          {icons.map((id) => (
            <div key={id} className={styles.iconCell} title={id}>
              <Icon icon={id} iconProps={{ size: 28 }} />
              <span>{id.replace('egen-icon-', '')}</span>
            </div>
          ))}
        </div>
        <div className={styles.controls}>
          <span className={styles.controlLabel}>Composants nommés :</span>
          <CalendarIcon size={24} />
          <DocumentIcon size={24} />
          <UserIcon size={24} />
          <SearchIcon size={24} />
        </div>
      </Section>

      <Section
        title="Pictogram"
        description={t(
          'showcasePictogramsDescription',
          `Registre des pictogrammes (${pictogramIds.length}) : <Pictogram pictogram="egen-pict-…" />, ou composants nommés (HomePictogram…).`,
        )}
      >
        <div className={styles.iconGrid}>
          {pictograms.map((id) => (
            <div key={id} className={styles.iconCell} title={id}>
              <Pictogram pictogram={id} pictogramProps={{ size: 56 }} />
              <span>{id.replace('egen-pict-', '')}</span>
            </div>
          ))}
        </div>
        <div className={styles.controls}>
          <span className={styles.controlLabel}>Composant nommé :</span>
          <HomePictogram size={56} />
        </div>
      </Section>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Cartes & états
// ─────────────────────────────────────────────────────────────────────────────
const HERO_TILES: HeroTile[] = [
  { id: 'a', title: 'Rentrée scolaire 2026', imageUrl: demoImage('#0f766e', '#134e4a', 'À la une'), linkText: 'Lire' },
  { id: 'b', title: 'Calendrier des examens', imageUrl: demoImage('#4338ca', '#1e1b4b') },
  { id: 'c', title: 'Nouveaux manuels', imageUrl: demoImage('#be123c', '#4c0519') },
  { id: 'd', title: 'Bourses nationales', imageUrl: demoImage('#b45309', '#451a03') },
  { id: 'e', title: 'Concours général', imageUrl: demoImage('#0369a1', '#082f49') },
];

const ContentShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const TOTAL = 42;
  const currentItems = Math.min(pageSize, TOTAL - (page - 1) * pageSize);

  return (
    <>
      <Section
        title="CardHeader · EmptyCard · ErrorState"
        description={t(
          'showcaseCardsStatesDescription',
          "En-tête de carte, état vide (avec action « Ajouter ») et état d'erreur (ErrorCard est un alias d'ErrorState).",
        )}
      >
        <div className={styles.variantsGrid}>
          <Variant label="CardHeader">
            <CardHeader title="Rendez-vous">
              <button type="button" className={styles.controlButton}>
                Voir tout
              </button>
            </CardHeader>
          </Variant>
          <Variant label="EmptyCard">
            <EmptyCard
              displayText="rendez-vous"
              headerTitle="Rendez-vous"
              launchForm={() => showToast({ kind: 'info', description: 'launchForm() appelé.' })}
            />
          </Variant>
          <Variant label="EmptyCardIllustration">
            <EmptyCardIllustration width="96" height="96" />
          </Variant>
          <Variant label="ErrorState">
            <ErrorState
              headerTitle="Rendez-vous"
              error={{ response: { status: 500, statusText: 'Internal Server Error' } }}
            />
          </Variant>
          <Variant label="ErrorCard (alias)">
            <ErrorCard headerTitle="Notes" error={{ response: { status: 404, statusText: 'Not Found' } }} />
          </Variant>
        </div>
      </Section>

      <Section
        title="ContentSection"
        description={t(
          'showcaseContentSectionDescription',
          'Section de contenu standard : titre, description, actions à droite ; variantes transparent / panel / bare.',
        )}
      >
        <div className={styles.variantsGrid}>
          <Variant label="variant='transparent'">
            <ContentSection
              title="Annonces récentes"
              description="Les dernières publications de votre établissement."
              actions={<button className={styles.controlButton}>Voir tout</button>}
            >
              <span className={styles.variantOutput}>Contenu de la section</span>
            </ContentSection>
          </Variant>
          <Variant label="variant='panel'">
            <ContentSection variant="panel" title="Statistiques" titleAs="h3" description="Vue d'ensemble">
              <span className={styles.variantOutput}>Contenu dans un panneau</span>
            </ContentSection>
          </Variant>
          <Variant label="variant='panel' · bare">
            <ContentSection variant="panel" bare title="Sans habillage">
              <span className={styles.variantOutput}>Padding retiré</span>
            </ContentSection>
          </Variant>
        </div>
      </Section>

      <Section
        title="ClassificationTags · NumericDataPoint"
        description={t(
          'showcaseTagsDatapointDescription',
          'Étiquettes de classification (couleurs configurables) et valeur chiffrée avec interprétation (variantes card et cell).',
        )}
      >
        <div className={styles.variantsGrid}>
          <Variant label="ClassificationTags">
            <ClassificationTags
              classifications={[
                { display: 'Prioritaire', rank: 'primary' },
                { display: 'À vérifier', rank: 'secondary' },
                { display: 'Archivé' },
              ]}
            />
          </Variant>
          <Variant label="NumericDataPoint · card (normal)">
            <NumericDataPoint
              entityUuid="demo"
              value={14.5}
              unit="/20"
              label="Moyenne générale"
              interpretation="normal"
            />
          </Variant>
          <Variant label="NumericDataPoint · card (critique)">
            <NumericDataPoint
              entityUuid="demo"
              value={4}
              unit="/20"
              label="Mathématiques"
              interpretation="critically_low"
            />
          </Variant>
          <Variant label="NumericDataPoint · cell (calculé)">
            <NumericDataPoint
              entityUuid="demo"
              variant="cell"
              value={19}
              unit="/20"
              referenceRange={{
                hiAbsolute: 20,
                hiCritical: 18,
                hiNormal: 16,
                lowNormal: 8,
                lowCritical: 4,
                lowAbsolute: 0,
              }}
            />
          </Variant>
        </div>
      </Section>

      <Section
        title="PageHeader · Pagination · ResponsiveWrapper"
        description={t(
          'showcasePageHeaderPaginationDescription',
          'En-tête de page (seul ou enveloppant PageHeaderContent), barre de pagination et wrapper responsive (Layer Carbon sur tablette).',
        )}
      >
        <div className={styles.variantsStack}>
          <Variant label="PageHeader (seul)">
            <PageHeader title="Tableau de bord" illustration={<HomePictogram size={56} />} />
          </Variant>
          <Variant label="PageHeader + PageHeaderContent">
            <PageHeader>
              <PageHeaderContent title="Établissements" illustration={<HomePictogram size={56} />} />
              <button className={styles.controlButton}>Action</button>
            </PageHeader>
          </Variant>
          <Variant label="Pagination">
            <Pagination
              currentItems={currentItems}
              totalItems={TOTAL}
              pageNumber={page}
              pageSize={pageSize}
              onPageNumberChange={({ page: p, pageSize: size }) => {
                setPage(p);
                setPageSize(size);
              }}
              dashboardLinkUrl="#"
              dashboardLinkLabel="Tout voir"
            />
          </Variant>
          <Variant label="ResponsiveWrapper">
            <ResponsiveWrapper>
              <span className={styles.variantOutput}>Rendu tel quel en desktop, dans un Layer en tablette.</span>
            </ResponsiveWrapper>
          </Variant>
        </div>
      </Section>

      <Section
        title="HeroMosaic"
        description={t(
          'showcaseHeroMosaicDescription',
          "Mosaïque « À la une » : une tuile principale et jusqu'à quatre tuiles secondaires (HeroTileCard).",
        )}
      >
        <HeroMosaic
          mainTile={HERO_TILES[0]}
          secondaryTiles={HERO_TILES.slice(1)}
          onSelectTile={(tile) => showToast({ kind: 'info', description: `Tuile sélectionnée : ${tile.title}` })}
        />
      </Section>

      <Section
        title="CustomOverflowMenu"
        description={t(
          'showcaseOverflowMenuDescription',
          'Menu de débordement (⋮) personnalisable : éléments, séparateur, élément désactivé ou dangereux.',
        )}
      >
        <div className={styles.controls}>
          <CustomOverflowMenu menuTitle="Actions">
            <CustomOverflowMenuItem itemText="Modifier" onClick={() => showToast({ description: 'Modifier' })} />
            <CustomOverflowMenuItem itemText="Dupliquer" />
            <CustomOverflowMenuItem itemText="Archivé (désactivé)" disabled />
            <CustomOverflowMenuItem itemText="Supprimer" isDelete hasDivider />
          </CustomOverflowMenu>
        </div>
      </Section>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Formulaires & filtres
// ─────────────────────────────────────────────────────────────────────────────
interface Etablissement {
  id: string;
  nom: string;
  ville: string;
}

const ETABLISSEMENTS: Etablissement[] = [
  { id: 'lycee-leon-mba', nom: 'Lycée national Léon Mba', ville: 'Libreville' },
  { id: 'lycee-technique', nom: 'Lycée technique Omar Bongo', ville: 'Libreville' },
  { id: 'college-bessieux', nom: 'Collège Bessieux', ville: 'Libreville' },
  { id: 'lycee-pg', nom: 'Lycée Paul Indjendjet Gondjout', ville: 'Port-Gentil' },
  { id: 'lycee-fc', nom: 'Lycée Mbaya', ville: 'Franceville' },
  { id: 'lycee-oyem', nom: "Lycée d'Oyem", ville: 'Oyem' },
  { id: 'college-mouila', nom: 'Collège de Mouila', ville: 'Mouila' },
];

/** Simule une recherche serveur annulable (latence 400 ms). */
const fetchEtablissements = (query: string, { signal }: { signal: AbortSignal }): Promise<Etablissement[]> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();
      resolve(ETABLISSEMENTS.filter((e) => !q || `${e.nom} ${e.ville}`.toLowerCase().includes(q)));
    }, 400);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

const FormsShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<React.ComponentProps<typeof DocumentToolbar>['currentCategory']>('all');
  const [sort, setSort] = useState<React.ComponentProps<typeof DocumentToolbar>['sortOption']>('recent');
  const [view, setView] = useState<React.ComponentProps<typeof DocumentToolbar>['viewMode']>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [etablissement, setEtablissement] = useState<string | undefined>();

  return (
    <>
      <Section
        title="EgenDatePicker · EgenDateRangePicker"
        description={t(
          'showcaseDatePickersDescription',
          'Sélecteurs de date et de période : valeur par défaut, erreur, désactivé, petite taille, bornes min/max.',
        )}
      >
        <div className={styles.variantsGrid}>
          <Variant label="EgenDatePicker">
            <EgenDatePicker labelText="Date de naissance" />
          </Variant>
          <Variant label="defaultValue">
            <EgenDatePicker labelText="Date de rentrée" defaultValue={new Date(2026, 8, 7)} />
          </Variant>
          <Variant label="invalid">
            <EgenDatePicker labelText="Date d'examen" invalid invalidText="Une date est requise." />
          </Variant>
          <Variant label="size='sm' · min/max">
            <EgenDatePicker
              labelText="Année scolaire"
              size="sm"
              minDate={new Date(2026, 0, 1)}
              maxDate={new Date(2026, 11, 31)}
            />
          </Variant>
          <Variant label="disabled">
            <EgenDatePicker labelText="Verrouillée" isDisabled />
          </Variant>
          <Variant label="EgenDateRangePicker">
            <EgenDateRangePicker labelText="Trimestre" defaultValue={[new Date(2026, 8, 7), new Date(2026, 11, 18)]} />
          </Variant>
        </div>
      </Section>

      <Section
        title="AsyncSelect"
        description={t(
          'showcaseAsyncSelectDescription',
          'Sélecteur à options chargées de façon asynchrone (recherche « serveur » simulée, annulable) — simple et multiple.',
        )}
      >
        <div className={styles.variantsGrid}>
          <Variant label="Simple" tall>
            <AsyncSelect<Etablissement>
              label="Établissement"
              placeholder="Choisir un établissement…"
              searchPlaceholder="Rechercher…"
              fetcher={fetchEtablissements}
              getOptionValue={(e) => e.id}
              getOptionLabel={(e) => e.nom}
              value={etablissement}
              onChange={(value) => setEtablissement(value || undefined)}
              clearable
              filterFn={false}
            />
            <span className={styles.variantOutput}>Valeur : {etablissement ?? '—'}</span>
          </Variant>
          <Variant label="Multiple (regroupé par ville)" tall>
            <AsyncSelect<Etablissement>
              label="Établissements"
              placeholder="Choisir…"
              multiple
              maxSelected={3}
              fetcher={fetchEtablissements}
              getOptionValue={(e) => e.id}
              getOptionLabel={(e) => e.nom}
              getOptionGroup={(e) => e.ville}
              filterFn={false}
            />
          </Variant>
        </div>
      </Section>

      <Section
        title="FilterBar · DocumentToolbar"
        description={t(
          'showcaseFiltersDescription',
          "Barre de filtres composables (démo commentée du framework : FilterBarDemo) et barre d'outils documentaire (catégorie, tri, vue, type).",
        )}
      >
        <div className={styles.variantsStack}>
          <Variant label="FilterBarDemo" tall>
            <FilterBarDemo />
          </Variant>
          <Variant label="DocumentToolbar">
            <DocumentToolbar
              currentCategory={category}
              onSelectCategory={setCategory}
              sortOption={sort}
              onSelectSort={setSort}
              viewMode={view}
              onToggleViewMode={setView}
              typeFilter={typeFilter}
              onSelectTypeFilter={setTypeFilter}
            />
            <span className={styles.variantOutput}>
              {category} · {sort} · {view} · {typeFilter}
            </span>
          </Variant>
        </div>
      </Section>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Fonds de page
// ─────────────────────────────────────────────────────────────────────────────
const BackgroundsShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(true);
  const [palette, setPalette] = useState<'teal' | 'indigo' | 'sunset'>('teal');
  const palettes = {
    teal: ['#0f766e', '#14b8a6', '#134e4a', '#042f2e'],
    indigo: ['#4338ca', '#6366f1', '#1e1b4b', '#0f0a2e'],
    sunset: ['#be123c', '#f97316', '#7c2d12', '#2a0a0a'],
  };

  return (
    <Section
      title="Fonds de page"
      description={t(
        'showcaseBackgroundsDescription',
        "Les pages déclarent leur fond avec <PageBackground> (rendu par l'hôte unique du shell). Ci-dessous, les briques utilisées, présentées dans des cadres bornés : GradientWave, AnimatedHomeBackground, DefaultPageBackground et GradientBlur.",
      )}
    >
      <div className={styles.controls}>
        <button type="button" className={styles.controlButton} onClick={() => setPlaying((v) => !v)}>
          {playing ? '⏸ Pause' : '▶ Lecture'}
        </button>
        {(Object.keys(palettes) as Array<keyof typeof palettes>).map((name) => (
          <button
            key={name}
            type="button"
            className={styles.controlButton}
            data-active={palette === name || undefined}
            onClick={() => setPalette(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={styles.variantsGrid}>
        <Variant label="GradientWave">
          <Stage>
            <GradientWave colors={palettes[palette]} isPlaying={playing} />
          </Stage>
        </Variant>
        <Variant label="AnimatedHomeBackground">
          <Stage>
            <AnimatedHomeBackground />
          </Stage>
        </Variant>
        <Variant label="DefaultPageBackground · imageSrc">
          <Stage>
            <DefaultPageBackground imageSrc={DEMO_BACKGROUND} imageAlt="Fond de démo" />
          </Stage>
        </Variant>
        <Variant label="GradientBlur">
          <Stage>
            <img src={DEMO_BACKGROUND} alt="" className={styles.stageImage} />
            <div className={styles.stageBlurBottom}>
              <GradientBlur />
            </div>
          </Stage>
        </Variant>
      </div>
    </Section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Notifications, snackbars et primitives de TopBar
// ─────────────────────────────────────────────────────────────────────────────
const KINDS = ['success', 'info', 'warning', 'error'] as const;

const NotificationsShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [following, setFollowing] = useState(false);

  return (
    <>
      <Section
        title="showNotification · showActionableNotification · showSnackbar"
        description={t(
          'showcaseNotificationsDescription',
          "API impérative d'alertes : notifications inline (auto-fermantes ou avec action), notifications actionnables et snackbars. Un bouton par type.",
        )}
      >
        <p className={styles.sectionDescription}>showNotification</p>
        <div className={styles.controls}>
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={styles.controlButton}
              onClick={() =>
                showNotification({
                  kind,
                  title: `Notification ${kind}`,
                  description: 'Message de la notification inline.',
                  millis: 6000,
                })
              }
            >
              {kind}
            </button>
          ))}
          <button
            type="button"
            className={styles.controlButton}
            onClick={() =>
              showNotification({
                kind: 'info',
                critical: true,
                title: 'Avec action',
                description: 'Cliquez sur le bouton pour réagir.',
                action: 'Annuler',
                onAction: () => showToast({ kind: 'success', description: 'Action effectuée.' }),
              })
            }
          >
            avec action
          </button>
        </div>

        <p className={styles.sectionDescription}>showActionableNotification</p>
        <div className={styles.controls}>
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={styles.controlButton}
              onClick={() =>
                showActionableNotification({
                  kind,
                  title: `Actionnable ${kind}`,
                  subtitle: 'Une action de votre part est attendue.',
                  actionButtonLabel: 'Confirmer',
                  progressActionLabel: 'Traitement…',
                  onActionButtonClick: () => undefined,
                })
              }
            >
              {kind}
            </button>
          ))}
        </div>

        <p className={styles.sectionDescription}>showSnackbar</p>
        <div className={styles.controls}>
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={styles.controlButton}
              onClick={() =>
                showSnackbar({
                  kind,
                  title: `Snackbar ${kind}`,
                  subtitle: 'Disparaît après 5 secondes.',
                  actionButtonLabel: 'Annuler',
                  onActionButtonClick: () => showToast({ description: 'Annulé.' }),
                })
              }
            >
              {kind}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="TopBarIconButton · TopBarAvatar · TopBarDivider"
        description={t(
          'showcaseTopBarPrimitivesDescription',
          'Primitives de la TopBar : bouton icône avec pastille de compteur, avatar (image ou initiales) et séparateur — états normal et actif.',
        )}
      >
        <div className={styles.stageDark}>
          <div className={styles.controls} style={{ alignItems: 'center' }}>
            <TopBarIconButton icon={<SearchIcon size={20} />} label="Rechercher" />
            <TopBarIconButton icon={<CalendarIcon size={20} />} label="Agenda" badge={3} />
            <TopBarIconButton icon={<DocumentIcon size={20} />} label="Documents (actif)" active />
            <TopBarDivider />
            <TopBarAvatar name="Amour Ngoua" />
            <TopBarAvatar name="Léa Mba" active />
          </div>
        </div>
      </Section>

      <Section
        title="SiteBanner · SiteSearchBar · SitePanelHeader"
        description={t(
          'showcaseSiteBasicsDescription',
          "Briques de l'espace Sites : bannière (avec bouton suivre), barre de recherche avec filtres et en-tête de panneau.",
        )}
      >
        <SitesBasics following={following} onToggleFollow={() => setFollowing((v) => !v)} />
      </Section>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Sites
// ─────────────────────────────────────────────────────────────────────────────
const SITES: SiteSummary[] = [
  {
    uuid: 's1',
    name: 'Direction générale des examens',
    shortName: 'DGE',
    category: 'Direction',
    description: 'Organisation des examens nationaux.',
    head: 'Dr. Mba',
    memberCount: 24,
    appCount: 5,
    status: 'ACTIVE',
    imageUrl: demoImage('#0f766e', '#134e4a'),
  },
  {
    uuid: 's2',
    name: 'Inspection académique Estuaire',
    shortName: 'IA-EST',
    category: 'Inspection',
    description: 'Suivi pédagogique des établissements.',
    head: 'M. Ondo',
    memberCount: 12,
    appCount: 3,
    status: 'ACTIVE',
    imageUrl: demoImage('#4338ca', '#1e1b4b'),
  },
  {
    uuid: 's3',
    name: 'Cellule numérique',
    shortName: 'CNUM',
    category: 'Support',
    description: 'Appui aux outils numériques.',
    head: 'Mme Nze',
    memberCount: 8,
    appCount: 7,
    status: 'ACTIVE',
    imageUrl: demoImage('#be123c', '#4c0519'),
  },
];

const AppIcon: React.FC<{ className?: string }> = ({ className }) => <CalendarIcon className={className} size={24} />;

const APPLICATIONS: SiteApplication[] = [
  {
    id: 'a1',
    name: 'Agenda',
    category: 'Outils',
    description: 'Calendrier partagé.',
    status: 'ACTIVE',
    icon: AppIcon,
    link: '#',
  },
  {
    id: 'a2',
    name: 'Documents',
    category: 'GED',
    description: 'Gestion documentaire.',
    status: 'ACTIVE',
    icon: AppIcon,
    link: '#',
  },
];

const RESOURCES: SiteResource[] = [
  {
    id: 'r1',
    title: 'Calendrier des examens.pdf',
    type: 'PDF',
    size: '1,2 Mo',
    updated: '12 sept.',
    category: 'Examens',
  },
  {
    id: 'r2',
    title: 'Circulaire de rentrée.docx',
    type: 'DOCX',
    size: '310 Ko',
    updated: '3 sept.',
    category: 'Circulaires',
  },
];

const INITIAL_TASKS: SiteTask[] = [
  {
    id: 't1',
    title: 'Valider les sujets',
    description: "Relecture des sujets d'examen.",
    priority: 'haute',
    status: 'todo',
    dueDate: '2026-10-30',
    assignedBy: 'M. Ondo',
    assignedTo: 'Mme Nze',
    tags: ['examens'],
  },
  {
    id: 't2',
    title: 'Mettre à jour le registre',
    description: 'Ajouter les nouveaux inscrits.',
    priority: 'moyenne',
    status: 'in_progress',
    dueDate: '2026-11-05',
    assignedBy: 'Dr. Mba',
    assignedTo: 'M. Ondo',
    tags: [],
  },
];

const ACTIVITIES: SiteActivity[] = [
  {
    id: 'ac1',
    userName: 'Mme Nze',
    userRole: 'Gestionnaire',
    action: 'upload',
    actionLabel: 'a déposé',
    targetTitle: 'Calendrier des examens.pdf',
    targetType: 'document',
    timeAgo: 'il y a 2 h',
  },
  {
    id: 'ac2',
    userName: 'M. Ondo',
    userRole: 'Inspecteur',
    action: 'validate',
    actionLabel: 'a validé',
    targetTitle: 'Circulaire de rentrée',
    targetType: 'document',
    timeAgo: 'hier',
  },
];

const MEMBERS: SiteMember[] = [
  { id: 'm1', name: 'Mme Nze', role: 'Gestionnaire', email: 'nze@example.ga' },
  { id: 'm2', name: 'M. Ondo', role: 'Inspecteur', email: 'ondo@example.ga' },
  { id: 'm3', name: 'Dr. Mba', role: 'Directeur', email: 'mba@example.ga' },
];

const INITIAL_SETTINGS: SiteSettingsValue = {
  title: 'Direction générale des examens',
  description: 'Organisation des examens nationaux.',
  visibility: 'MODERATED',
  allowMemberInvites: true,
  notifyOnUpload: true,
  notifyOnValidation: false,
};

const SitesBasics: React.FC<{ following: boolean; onToggleFollow: () => void }> = ({ following, onToggleFollow }) => {
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <div className={styles.variantsStack}>
      <Variant label="SiteBanner">
        <SiteBanner
          title="Direction générale des examens"
          subtitle="24 membres · 5 applications"
          following={following}
          onToggleFollow={onToggleFollow}
        />
      </Variant>
      <Variant label="SiteSearchBar">
        <SiteSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un site…"
          activeFilterCount={search ? 1 : 0}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          onReset={() => setSearch('')}
          filterPanel={<span className={styles.variantOutput}>Panneau de filtres</span>}
        />
      </Variant>
      <Variant label="SitePanelHeader">
        <SitePanelHeader
          icon={<CalendarIcon size={24} />}
          title="Applications"
          description="Outils disponibles pour ce site."
          actions={<button className={styles.controlButton}>Ajouter</button>}
        />
      </Variant>
      <Variant label="SiteCarousel" tall>
        <SiteCarousel
          sites={SITES}
          height={200}
          onSelect={(site) => showToast({ kind: 'info', description: `Site : ${site.name}` })}
        />
      </Variant>
    </div>
  );
};

type DemoSiteTab = 'applications' | 'resources' | 'tasks' | 'activity' | 'members' | 'settings';

const SitesShowcaseContent: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DemoSiteTab>('applications');
  const [tasks, setTasks] = useState<SiteTask[]>(INITIAL_TASKS);

  const tabs = [
    { id: 'applications' as const, label: 'Applications' },
    { id: 'resources' as const, label: 'Ressources' },
    { id: 'tasks' as const, label: 'Tâches', badge: tasks.length },
    { id: 'activity' as const, label: 'Activité' },
    { id: 'members' as const, label: 'Membres' },
    { id: 'settings' as const, label: 'Paramètres' },
  ];

  return (
    <Section
      title="SiteTabbedLayout + panneaux de site"
      description={t(
        'showcaseSitesDescription',
        'Mise en page à onglets d’un site et ses six panneaux (applications, ressources, tâches, activité, membres, paramètres), alimentés ici par des données de démonstration.',
      )}
    >
      <div className={styles.siteStage}>
        <SiteTabbedLayout<DemoSiteTab> activeTab={tab} onTabChange={setTab} tabs={tabs}>
          {tab === 'applications' && (
            <SiteApplicationsPanel
              applications={APPLICATIONS}
              onOpen={(app) => showToast({ kind: 'info', description: `Ouverture : ${app.name}` })}
            />
          )}
          {tab === 'resources' && (
            <SiteResourcesPanel
              resources={RESOURCES}
              onDownload={(r) => showToast({ kind: 'success', description: `Téléchargement : ${r.title}` })}
            />
          )}
          {tab === 'tasks' && (
            <SiteTasksPanel
              siteName="DGE"
              tasks={tasks}
              onToggleStatus={(task) =>
                setTasks((all) =>
                  all.map((x) => (x.id === task.id ? { ...x, status: x.status === 'done' ? 'todo' : 'done' } : x)),
                )
              }
              onCreate={(draft) =>
                setTasks((all) => [
                  ...all,
                  {
                    ...draft,
                    id: `t${all.length + 1}`,
                    status: 'todo',
                    assignedBy: 'Vous',
                    assignedTo: 'Vous',
                    tags: [],
                  },
                ])
              }
            />
          )}
          {tab === 'activity' && <SiteActivityPanel siteName="DGE" activities={ACTIVITIES} />}
          {tab === 'members' && <SiteMembersPanel siteName="DGE" members={MEMBERS} />}
          {tab === 'settings' && (
            <SiteSettingsPanel
              siteName="DGE"
              siteUuid="s1"
              initialValue={INITIAL_SETTINGS}
              storage={{ usedLabel: '3,2 Go', quotaLabel: '10 Go', percent: 32 }}
              onSave={() => showToast({ kind: 'success', description: 'Paramètres enregistrés.' })}
            />
          )}
        </SiteTabbedLayout>
      </div>
    </Section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Exports (une frontière d'erreur par groupe : un composant fautif n'emporte pas la page)
// ─────────────────────────────────────────────────────────────────────────────
export const IconsShowcase: React.FC = () => (
  <ShowcaseBoundary name="Icônes & pictogrammes">
    <IconsShowcaseContent />
  </ShowcaseBoundary>
);

export const ContentShowcase: React.FC = () => (
  <ShowcaseBoundary name="Cartes & états (CardHeader · EmptyCard · ErrorState · …)">
    <ContentShowcaseContent />
  </ShowcaseBoundary>
);

export const FormsShowcase: React.FC = () => (
  <ShowcaseBoundary name="Formulaires & filtres (DatePicker · AsyncSelect · FilterBar)">
    <FormsShowcaseContent />
  </ShowcaseBoundary>
);

export const BackgroundsShowcase: React.FC = () => (
  <ShowcaseBoundary name="Fonds de page (GradientWave · PageBackground · …)">
    <BackgroundsShowcaseContent />
  </ShowcaseBoundary>
);

export const NotificationsShowcase: React.FC = () => (
  <ShowcaseBoundary name="Notifications, TopBar & briques Sites">
    <NotificationsShowcaseContent />
  </ShowcaseBoundary>
);

export const SitesShowcase: React.FC = () => (
  <ShowcaseBoundary name="Sites (SiteTabbedLayout · panneaux)">
    <SitesShowcaseContent />
  </ShowcaseBoundary>
);
