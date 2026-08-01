import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AddIcon,
  CardModal,
  CascadingNavDropdown,
  CircularGallery,
  DecoratedCard,
  DynamicField,
  EntityDetailBrowser,
  FolderGallery,
  ImageSwiper,
  LiquidGlassCard,
  MenuToggleButton,
  Select,
  SelectContent,
  SelectTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  showToast,
  StaggeredMenuPanel,
  Carousel,
  SliderContainer,
  Slider,
  ThumbsSlider,
  InteractiveSelector,
  LayoutGrid,
  TestimonialCardStack,
  useConfig,
  type CardModalAnimationPreset,
  type CardVariant,
  type EmblaOptionsType,
  type EntityDetailBrowserItem,
  type InteractiveSelectorOption,
  type LayoutGridItem,
  type SelectOption,
  type NavigationItem,
  type TestimonialItem,
} from '@egen/esm-framework';
import Autoplay from 'embla-carousel-autoplay';
import type { ConfigSchema } from '../config-schema';
import styles from './home.scss';

// =============================================================================
//  Icônes de démo — InteractiveSelector (@egen/esm-styleguide/selections)
//
//  Le composant source utilisait react-icons/fa (FaCampground, FaFire...),
//  librairie absente du monorepo (aucune trace dans les package.json — le
//  set d'icônes du projet est @egen/esm-styleguide/icons, un registre fermé
//  de pictos administratifs/médicaux sans équivalent thématique "glamping").
//  InteractiveSelector lui-même reste 100% agnostique (icon: ReactNode) —
//  ces 5 SVG minimalistes (currentColor, 24px, même esprit que les icônes
//  Font Awesome d'origine) n'existent que pour CETTE démo, localement, sans
//  polluer le registre d'icônes partagé.
// =============================================================================

const DemoTentIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 L21 19 H3 Z" />
    <path d="M12 3 L12 19" />
    <path d="M8.5 19 L12 12 L15.5 19" />
  </svg>
);

const DemoFireIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c1 3-3 4-3 7a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 3-8 0-1 0-2 2-2Z" />
  </svg>
);

const DemoWaterIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c4 5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 3-7 7-12Z" />
  </svg>
);

const DemoHotTubIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" />
    <rect x="4" y="10" width="16" height="7" rx="1.5" />
    <path d="M7 10V7a2 2 0 0 1 4 0M13 10V6a2 2 0 0 1 4 0v4" />
  </svg>
);

const DemoHikingIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" />
    <path d="M9 21l2.5-6.5L9 11l1-3 3 2 2 6-2 5" />
    <path d="M13 8l4 1.5-1 4" />
  </svg>
);

// =============================================================================
//  HOME PAGE — Écran d'accueil authentifié
//
//  Cette page n'a plus de navigation propre : elle est rendue par la SPA
//  DANS l'espace authentifié (la TopBar de @egen/esm-primary-navigation-app
//  s'affiche naturellement au-dessus, comme pour n'importe quelle autre
//  route du tenant — voir routes.json de esm-primary-navigation-app).
//
//  Rôle actuel : vitrine de test des composants de base en cours de
//  construction dans @egen/esm-styleguide, avant leur diffusion dans les
//  vraies apps. Chaque composant testé ici est ajouté dans une section
//  dédiée, avec ses variantes.
// =============================================================================

const ComponentShowcasePage: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();

  // ── Démo : DynamicField (@egen/esm-styleguide/fields) ──────────────────────
  const [outlinedValue, setOutlinedValue] = useState('');
  const [filledValue, setFilledValue] = useState('');
  const [standardValue, setStandardValue] = useState('');
  const [kineticValue, setKineticValue] = useState('');

  // ── Démo : StaggeredMenuPanel / MenuToggleButton (@egen/esm-styleguide/staggered-menu) ──
  const [staggeredMenuOpen, setStaggeredMenuOpen] = useState(false);
  // Défaut = config.staggeredMenu.position, mais surchargeable en direct dans
  // la vitrine via le contrôle gauche/droite ci-dessous — pour tester les deux
  // sens sans devoir changer la config à chaque fois.
  const [staggeredMenuPosition, setStaggeredMenuPosition] = useState<'left' | 'right'>(config.staggeredMenu.position);
  const demoStaggeredItems = [
    { label: 'Accueil', ariaLabel: "Aller à l'accueil", link: '#' },
    { label: 'Applications', ariaLabel: 'Voir les applications', link: '#' },
    { label: 'Paramètres', ariaLabel: 'Ouvrir les paramètres', link: '#' },
  ];
  const demoStaggeredSocials = [
    { label: 'GitHub', link: 'https://github.com/amourgit' },
    { label: 'LinkedIn', link: 'https://linkedin.com' },
  ];

  // ── Démo : CascadingNavDropdown (@egen/esm-styleguide/cascading-nav-dropdown) ──
  const demoNavigationTree: NavigationItem[] = [
    {
      id: 'education',
      label: 'Éducation',
      children: [
        { id: 'eigen', label: 'EIGEN', path: '#' },
        { id: 'iam-central', label: 'IAM Central', path: '#' },
        {
          id: 'egen-suite',
          label: 'Suite EGEN',
          children: [
            { id: 'esm-styleguide', label: 'esm-styleguide', path: '#' },
            { id: 'esm-tenant', label: 'esm-tenant', path: '#' },
          ],
        },
      ],
    },
    {
      id: 'civitas',
      label: 'CIVITAS',
      children: [
        { id: 'civitas-site', label: 'Site CIVITAS', path: '#' },
        { id: 'cae', label: 'CIVITAS Acquisition Engine', path: '#' },
      ],
    },
    { id: 'edugabon', label: 'EDUGABON', path: '#' },
  ];

  // ── Démo : Toast (@egen/esm-styleguide/toasts) ──────────────────────────────
  const handleTransferDemo = () => {
    const toastKey = `demo-transfer-${Date.now()}`;
    let progress = 0;
    showToast({
      toastKey,
      variant: 'transfer',
      kind: 'info',
      title: 'rapport-annuel.pdf',
      description: 'Téléversement en cours…',
      progress,
    });
    const interval = setInterval(() => {
      progress += 10;
      showToast({
        toastKey,
        variant: 'transfer',
        kind: 'info',
        title: 'rapport-annuel.pdf',
        description: progress >= 100 ? 'Terminé.' : 'Téléversement en cours…',
        progress,
      });
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 400);
  };

  // ── Démo : EntityDetailBrowser (@egen/esm-styleguide/master-detail/entity-detail-browser) ──
  // Exemple générique (un cours et ses leçons) — preuve que le composant
  // n'a aucune donnée en dur et ne suppose aucun domaine particulier.
  const demoItems: EntityDetailBrowserItem[] = [
    {
      id: 1,
      title: 'Introduction aux composants EGEN',
      meta: '12 min',
      credits: <span>Par Amour N., CIVITAS Studio</span>,
      detail: (
        <p>
          Première leçon de la démo — ce panneau de détail ne s'ouvre QUE si
          <code> item.detail</code> est fourni. Il peut contenir n'importe
          quel texte ou composant React (vidéo, PDF, quiz...).
        </p>
      ),
    },
    { id: 2, title: 'Le système de thème (tokens)', meta: '18 min' },
    { id: 3, title: 'Composants et variantes', meta: '22 min' },
    { id: 4, title: 'Bonnes pratiques SCSS', meta: '15 min' },
  ];

  // ── Démo : ImageSwiper (@egen/esm-styleguide/carousel/image-swiper) ────────
  const demoSwiperImages = [
    'https://picsum.photos/seed/swiper-1/400/560',
    'https://picsum.photos/seed/swiper-2/400/560',
    'https://picsum.photos/seed/swiper-3/400/560',
    'https://picsum.photos/seed/swiper-4/400/560',
    'https://picsum.photos/seed/swiper-5/400/560',
  ];

  // ── Démo : CircularGallery (@egen/esm-styleguide/carousel/circular-gallery) ──
  const demoCircularGalleryImages = [
    { title: 'Pochette 1', url: 'https://picsum.photos/seed/circular-1/600/600' },
    { title: 'Pochette 2', url: 'https://picsum.photos/seed/circular-2/600/600' },
    { title: 'Pochette 3', url: 'https://picsum.photos/seed/circular-3/600/600' },
    { title: 'Pochette 4', url: 'https://picsum.photos/seed/circular-4/600/600' },
    { title: 'Pochette 5', url: 'https://picsum.photos/seed/circular-5/600/600' },
    { title: 'Pochette 6', url: 'https://picsum.photos/seed/circular-6/600/600' },
  ];

  // ── Démo : Carousel/ThumbsSlider (@egen/esm-styleguide/carousel/slider) ─────
  const verticalSliderOptions: EmblaOptionsType = { loop: false, axis: 'y' };
  const demoVerticalSliderImages = [
    { src: 'https://images.unsplash.com/photo-1759395073808-17782f3d8d66?q=80&w=1471&auto=format&fit=crop', alt: 'Slide 1' },
    { src: 'https://images.unsplash.com/photo-1759434192768-fe3facebd5f6?q=80&w=1471&auto=format&fit=crop', alt: 'Slide 2' },
    { src: 'https://images.unsplash.com/photo-1758641008040-28cdd59ca8fb?q=80&w=687&auto=format&fit=crop', alt: 'Slide 3' },
    { src: 'https://images.unsplash.com/photo-1618220649687-ba860f3176e7?q=80&w=1474&auto=format&fit=crop', alt: 'Slide 4' },
    { src: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=765&auto=format&fit=crop', alt: 'Slide 5' },
  ];

  // ── Démo : InteractiveSelector (@egen/esm-styleguide/selections) ───────────
  const demoInteractiveSelectorOptions: InteractiveSelectorOption[] = [
    {
      title: 'Luxury Tent',
      description: 'Cozy glamping under the stars',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      icon: <DemoTentIcon />,
    },
    {
      title: 'Campfire Feast',
      description: "Gourmet s'mores & stories",
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
      icon: <DemoFireIcon />,
    },
    {
      title: 'Lakeside Retreat',
      description: 'Private dock & canoe rides',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      icon: <DemoWaterIcon />,
    },
    {
      title: 'Mountain Spa',
      description: 'Outdoor sauna & hot tub',
      image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
      icon: <DemoHotTubIcon />,
    },
    {
      title: 'Guided Adventure',
      description: 'Expert-led nature tours',
      image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80',
      icon: <DemoHikingIcon />,
    },
  ];

  // ── Démo : LayoutGrid (@egen/esm-styleguide/containers) ─────────────────────
  const demoLayoutGridItems: LayoutGridItem[] = [
    {
      id: 1,
      thumbnail: 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=800&q=80',
      content: (
        <div>
          <h3 className={styles.layoutGridContentTitle}>Salle de classe moderne</h3>
          <p className={styles.layoutGridContentText}>
            Un espace pensé pour l'apprentissage collaboratif, avec un accès direct aux ressources numériques.
          </p>
        </div>
      ),
    },
    {
      id: 2,
      thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
      content: (
        <div>
          <h3 className={styles.layoutGridContentTitle}>Bibliothèque universitaire</h3>
          <p className={styles.layoutGridContentText}>
            Un lieu calme pour approfondir les cours, consulter les archives et préparer les examens.
          </p>
        </div>
      ),
    },
    {
      id: 3,
      thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      content: (
        <div>
          <h3 className={styles.layoutGridContentTitle}>Travaux pratiques</h3>
          <p className={styles.layoutGridContentText}>
            Des équipements modernes pour relier la théorie à la pratique dans chaque filière.
          </p>
        </div>
      ),
    },
    {
      id: 4,
      thumbnail: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      content: (
        <div>
          <h3 className={styles.layoutGridContentTitle}>Vie de campus</h3>
          <p className={styles.layoutGridContentText}>
            Des espaces partagés pour se retrouver entre les cours et faire vivre la communauté étudiante.
          </p>
        </div>
      ),
    },
  ];

  // ── Démo : TestimonialCardStack (@egen/esm-styleguide/carousel/testimonial-card) ──
  const demoTestimonials: TestimonialItem[] = [
    {
      id: 1,
      testimonial: 'Un outil qui a changé notre façon de travailler au quotidien.',
      author: 'Amina N.',
    },
    {
      id: 2,
      testimonial: 'Déploiement multi-tenant en quelques jours seulement.',
      author: 'Jean-Pierre O.',
    },
    {
      id: 3,
      testimonial: 'Le support est remarquable, toujours réactif.',
      author: 'Chantal M.',
    },
  ];

  // ── Démo : Select (@egen/esm-styleguide/selections/select-popover) ─────────
  const demoTenants: SelectOption[] = [
    { id: 'eigen-national', name: 'EIGEN — Gabon (national)', plan: 'Établissement', logo: 'https://picsum.photos/seed/tenant-eigen/64' },
    { id: 'iam-central', name: 'IAM Central', plan: 'Plateforme', logo: 'https://picsum.photos/seed/tenant-iam/64' },
    { id: 'civitas', name: 'CIVITAS', plan: 'Entreprise', logo: 'https://picsum.photos/seed/tenant-civitas/64' },
    { id: 'edugabon', name: 'EDUGABON', plan: 'Établissement' },
  ];
  const [selectedTenantId, setSelectedTenantId] = useState('eigen-national');

  // ── Démo : DecoratedCard (@egen/esm-styleguide/cards/decorated-card) ────────
  const cardVariants: CardVariant[] = ['default', 'dots', 'gradient', 'plus', 'neubrutalism', 'inner', 'lifted', 'corners', 'glass', 'mirror'];
  const [selectedCardVariant, setSelectedCardVariant] = useState<CardVariant>('default');

  // ── Démo : CardModal (@egen/esm-styleguide/dialogs/card-modal) ──────────────
  // Combinaisons entièrement libres : n'importe quelle variante de carte
  // ci-dessus × n'importe quelle animation × déplaçable ou non.
  const modalAnimations: CardModalAnimationPreset[] = [
    'fade',
    'scale',
    'zoom',
    'slide-up',
    'slide-down',
    'slide-left',
    'slide-right',
    'none',
  ];
  const [selectedModalCardVariant, setSelectedModalCardVariant] = useState<CardVariant>('glass');
  const [selectedModalAnimation, setSelectedModalAnimation] = useState<CardModalAnimationPreset>('scale');
  const [modalDraggable, setModalDraggable] = useState(false);
  const [modalDockable, setModalDockable] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);


  // ── Démo : FolderGallery (@egen/esm-styleguide/containers/folder-gallery) ──
  // Dossier n°1 : des photos (nature "image")
  const demoPhotoItems = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop',
  ].map((src, i) => ({
    id: i,
    content: <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
  }));

  // Dossier n°2 : des cartes profils (nature "texte + mise en page"), pas des images —
  // preuve que 'items' accepte n'importe quel contenu React.
  const demoProfileItems = [
    { name: 'Amour N.', role: 'Fondateur' },
    { name: 'Samuel M.', role: 'Développeur' },
    { name: 'Équipe EGEN', role: 'Produit' },
  ].map((person, i) => ({
    id: i,
    content: (
      <div className={styles.profileCardDemo}>
        <div className={styles.profileCardAvatar}>{person.name.charAt(0)}</div>
        <p className={styles.profileCardName}>{person.name}</p>
        <p className={styles.profileCardRole}>{person.role}</p>
      </div>
    ),
  }));

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{config.pageTitle}</h1>
        <p className={styles.pageSubtitle}>
          {t('showcaseSubtitle', 'Composants @egen/esm-styleguide en cours de validation visuelle.')}
        </p>
      </header>

      <main className={styles.sections}>
        {/* ── Section : DynamicField ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>DynamicField</h2>
          <p className={styles.sectionDescription}>
            {t('showcaseFieldsDescription', 'Champ de saisie unique, multi-variante (outlined / filled / standard / kinetic).')}
          </p>
          <div className={styles.fieldsGrid}>
            <DynamicField
              variant="outlined"
              label="Outlined"
              value={outlinedValue}
              onChange={setOutlinedValue}
            />
            <DynamicField
              variant="filled"
              label="Filled"
              value={filledValue}
              onChange={setFilledValue}
            />
            <DynamicField
              variant="standard"
              label="Standard"
              value={standardValue}
              onChange={setStandardValue}
            />
            <DynamicField
              variant="kinetic"
              label="Kinetic"
              value={kineticValue}
              onChange={setKineticValue}
            />
          </div>
        </section>

        {/* ── Section : StaggeredMenu ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>StaggeredMenuPanel</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseMenuDescription',
              'Panneau de navigation latéral animé (GSAP) — côté configurable : gauche ou droite.',
            )}
          </p>
          <div className={styles.demoRow}>
            <div className={styles.sideToggle} role="group" aria-label="Côté d'ouverture">
              <button
                type="button"
                className={styles.sideToggleButton}
                data-active={staggeredMenuPosition === 'left' || undefined}
                onClick={() => setStaggeredMenuPosition('left')}
              >
                ◀ Gauche
              </button>
              <button
                type="button"
                className={styles.sideToggleButton}
                data-active={staggeredMenuPosition === 'right' || undefined}
                onClick={() => setStaggeredMenuPosition('right')}
              >
                Droite ▶
              </button>
            </div>

            <MenuToggleButton
              isOpen={staggeredMenuOpen}
              onToggle={() => setStaggeredMenuOpen((prev) => !prev)}
              menuButtonColor="var(--colors-surface-foreground)"
              openMenuButtonColor="var(--colors-surface-foreground)"
              changeMenuColorOnOpen
            />
          </div>
        </section>

        {/* ── Section : CascadingNavDropdown ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>CascadingNavDropdown</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseCascadingNavDescription',
              'Dropdown de navigation en cascade, ouverture vers le bas ou vers le haut selon la prop direction.',
            )}
          </p>
          <div className={styles.demoRow}>
            <CascadingNavDropdown
              items={demoNavigationTree}
              triggerLabel="Direction: bas"
              direction="down"
              searchable
              onNavigate={(path) => window.alert(`Navigate: ${path}`)}
            />
            <CascadingNavDropdown
              items={demoNavigationTree}
              triggerLabel="Direction: haut"
              direction="up"
              searchable
              onNavigate={(path) => window.alert(`Navigate: ${path}`)}
            />
          </div>
        </section>

        {/* ── Section : Sheet ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sheet</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseSheetDescription',
              'Panneau modal glissable (drag), ancré en haut ou en bas selon la prop side.',
            )}
          </p>
          <div className={styles.demoRow}>
            <Sheet side="top">
              <SheetTrigger className={styles.demoButton}>Ouvrir (haut)</SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet — side=&quot;top&quot;</SheetTitle>
                  <SheetDescription>Glisse depuis le haut de l'écran. Fermeture en glissant vers le haut.</SheetDescription>
                </SheetHeader>
                <p>Contenu de démonstration.</p>
                <SheetFooter>
                  <SheetClose className={styles.demoButton}>Fermer</SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet side="bottom">
              <SheetTrigger className={styles.demoButton}>Ouvrir (bas)</SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet — side=&quot;bottom&quot;</SheetTitle>
                  <SheetDescription>Glisse depuis le bas de l'écran. Fermeture en glissant vers le bas.</SheetDescription>
                </SheetHeader>
                <p>Contenu de démonstration.</p>
                <SheetFooter>
                  <SheetClose className={styles.demoButton}>Fermer</SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </section>

        {/* ── Section : Toast ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Toast</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseToastDescription',
              "Notification 'verre liquide', 3 variantes : default (compte à rebours), transfer (progression réelle), actions (commandes personnalisables).",
            )}
          </p>
          <div className={styles.demoRow}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() =>
                showToast({
                  kind: 'success',
                  title: 'Enregistré',
                  description: 'Les modifications ont bien été sauvegardées.',
                })
              }
            >
              Toast: default
            </button>
            <button type="button" className={styles.demoButton} onClick={handleTransferDemo}>
              Toast: transfer
            </button>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() =>
                showToast({
                  kind: 'info',
                  variant: 'actions',
                  duration: 0,
                  title: 'Nouvelle demande de rôle',
                  description: 'Amour Ngoua demande le rôle « Administrateur tenant ».',
                  actions: [
                    { label: 'Refuser', kind: 'danger', onClick: () => showToast({ kind: 'error', description: 'Demande refusée.' }) },
                    { label: 'Approuver', kind: 'primary', onClick: () => showToast({ kind: 'success', description: 'Demande approuvée.' }) },
                  ],
                })
              }
            >
              Toast: actions
            </button>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() =>
                showToast({
                  kind: 'error',
                  critical: true,
                  title: 'Échec de la synchronisation',
                  description: 'Le serveur EDUNET_GABON_BACKEND est injoignable.',
                })
              }
            >
              Toast: error
            </button>
          </div>
        </section>

        {/* ── Section : LiquidGlassCard ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>LiquidGlassCard</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseGlassCardDescription',
              'Effet de verre liquide autonome (flou + distorsion + reflets), utilisé en interne par Toast.',
            )}
          </p>
          <LiquidGlassCard
            blurIntensity="lg"
            shadowIntensity="md"
            glowIntensity="md"
            borderRadius="var(--border-radius-lg)"
            className={styles.glassCardDemo}
          >
            <p className={styles.glassCardDemoText}>Contenu affiché à travers le verre.</p>
          </LiquidGlassCard>
        </section>

        {/* ── Section : FolderGallery ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>FolderGallery</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseFolderGalleryDescription',
              "Dossier interactif générique — 'items' accepte n'importe quel contenu React. Deux exemples ci-dessous : photos et cartes profils.",
            )}
          </p>
          <div className={styles.folderGalleryRow}>
            <FolderGallery title="Photography.gallery" hint="Glisser une photo vers le bas pour fermer" items={demoPhotoItems} />
            <FolderGallery
              title="Équipe.dossier"
              hint="Glisser une carte vers le bas pour fermer"
              items={demoProfileItems}
              itemWidth="12rem"
              itemHeight="14rem"
            />
          </div>
        </section>

        {/* ── Section : DecoratedCard ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>DecoratedCard</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseDecoratedCardDescription',
              '8 variantes décoratives prêtes à l’emploi — aucune taille imposée, le contenu dicte la taille.',
            )}
          </p>
          <div className={styles.demoRow}>
            {cardVariants.map((variant) => (
              <button
                key={variant}
                type="button"
                className={styles.sideToggleButton}
                data-active={selectedCardVariant === variant || undefined}
                onClick={() => setSelectedCardVariant(variant)}
              >
                {variant}
              </button>
            ))}
          </div>
          <div className={styles.decoratedCardDemo}>
            <DecoratedCard
              variant={selectedCardVariant}
              title="Statut du tenant"
              description="EIGEN — Gabon (national)"
            >
              <p className={styles.decoratedCardBody}>
                Variante actuelle : <strong>{selectedCardVariant}</strong>
              </p>
            </DecoratedCard>
          </div>

          <p className={styles.sectionDescription} style={{ marginTop: '1.5rem' }}>
            Sous-variantes de taille/forme du variant <strong>mirror</strong> (prop <code>size</code>) :
          </p>
          <div className={styles.demoRow} style={{ alignItems: 'center' }}>
            <DecoratedCard variant="mirror" size="sm">
              <span className={styles.decoratedCardBody}>Small</span>
            </DecoratedCard>
            <DecoratedCard variant="mirror" size="default">
              <span className={styles.decoratedCardBody} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Generate <AddIcon size={18} />
              </span>
            </DecoratedCard>
            <DecoratedCard variant="mirror" size="lg">
              <span className={styles.decoratedCardBody}>Submit</span>
            </DecoratedCard>
            <DecoratedCard variant="mirror" size="icon">
              <AddIcon size={18} />
            </DecoratedCard>
          </div>
        </section>

        {/* ── Section : CardModal ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>CardModal</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseCardModalDescription',
              "Modal générique dont le conteneur est n'importe quelle variante de carte ci-dessus — combinez librement variante, animation et déplaçable.",
            )}
          </p>

          <p className={styles.decoratedCardBody} style={{ marginBottom: '0.5rem' }}>
            Variante de carte du modal :
          </p>
          <div className={styles.demoRow}>
            {cardVariants.map((variant) => (
              <button
                key={variant}
                type="button"
                className={styles.sideToggleButton}
                data-active={selectedModalCardVariant === variant || undefined}
                onClick={() => setSelectedModalCardVariant(variant)}
              >
                {variant}
              </button>
            ))}
          </div>

          <p className={styles.decoratedCardBody} style={{ margin: '1rem 0 0.5rem' }}>
            Animation d'ouverture/fermeture :
          </p>
          <div className={styles.demoRow}>
            {modalAnimations.map((anim) => (
              <button
                key={anim}
                type="button"
                className={styles.sideToggleButton}
                data-active={selectedModalAnimation === anim || undefined}
                onClick={() => setSelectedModalAnimation(anim)}
              >
                {anim}
              </button>
            ))}
          </div>

          <div className={styles.demoRow} style={{ marginTop: '1rem', alignItems: 'center' }}>
            <label className={styles.decoratedCardBody} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={modalDraggable} onChange={(e) => setModalDraggable(e.target.checked)} />
              Déplaçable à la souris
            </label>
            <label
              className={styles.decoratedCardBody}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: modalDraggable ? 1 : 0.5 }}
            >
              <input
                type="checkbox"
                checked={modalDockable}
                disabled={!modalDraggable}
                onChange={(e) => setModalDockable(e.target.checked)}
              />
              Ancrable en coin (façon iOS/macOS)
            </label>
            <button type="button" className={styles.demoButton} onClick={() => setIsDemoModalOpen(true)}>
              Ouvrir le modal
            </button>
          </div>

          <CardModal
            open={isDemoModalOpen}
            onOpenChange={setIsDemoModalOpen}
            cardVariant={selectedModalCardVariant}
            cardProps={{
              title: 'Confirmation',
              description: `Carte : ${selectedModalCardVariant} — Animation : ${selectedModalAnimation}`,
            }}
            animation={selectedModalAnimation}
            draggable={modalDraggable}
            dockable={modalDraggable && modalDockable}
          >
            <p className={styles.decoratedCardBody}>
              Contenu du modal — entièrement libre, passé via <code>children</code>. Ferme-le avec la croix,
              Échap, un clic en dehors{modalDraggable ? ', ou déplace-le avant de le fermer' : ''}
              {modalDockable ? '. Glisse-le près du bord gauche ou droit pour l’ancrer en bulle' : ''}.
            </p>
          </CardModal>
        </section>

        {/* ── Section : EntityDetailBrowser ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>EntityDetailBrowser</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseEntityDetailBrowserDescription',
              "Entité + liste de sous-éléments consultables, panneau de détail et panneau d'entité liée, tout via props. Cliquer sur la première leçon ou sur le bouton + pour voir le formateur.",
            )}
          </p>
          <EntityDetailBrowser
            title="Introduction à React"
            coverImageUrl="https://picsum.photos/seed/egen-course/800/800"
            category="Développement web"
            itemCountLabel="4 leçons"
            meta={2026}
            items={demoItems}
            relatedEntity={{
              name: 'CIVITAS Studio',
              photoUrl: 'https://picsum.photos/seed/egen-formateur/800/800',
              category: 'Formateur',
              itemCountLabel: '12 cours',
              statLabel: '3,2k apprenants',
              description:
                "Collectif de formation basé à Libreville, fondé par CIVITAS — cette description est un exemple, entièrement fournie via la prop 'relatedEntity.description'.",
            }}
          />
        </section>

        {/* ── Section : Select ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Select</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseSelectDescription',
              "Popover de sélection générique (compound component) — déclencheur + panneau avec recherche, avatar/repli sur l'initiale, rendu entièrement personnalisable.",
            )}
          </p>
          <Select options={demoTenants} selectedOptionId={selectedTenantId} onOptionChange={(o) => setSelectedTenantId(o.id)}>
            <SelectTrigger />
            <SelectContent title="Tenants" searchable searchPlaceholder="Rechercher un tenant…" />
          </Select>
        </section>

        {/* ── Section : ImageSwiper ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ImageSwiper</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseImageSwiperDescription',
              "Pile de cartes swipable (effet 3D empilé, façon Tinder) — glisse une carte à gauche ou à droite pour la faire tourner en fin de pile.",
            )}
          </p>
          <ImageSwiper images={demoSwiperImages} />
        </section>

        {/* ── Section : CircularGallery ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>CircularGallery</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseCircularGalleryDescription',
              "Galerie à pastilles circulaires (GSAP + MotionPathPlugin) — clique une miniature pour la déployer en plein cadre, avec rebond à la fermeture. Défilement automatique toutes les 4,5s.",
            )}
          </p>
          <CircularGallery images={demoCircularGalleryImages} />
        </section>

        {/* ── Section : InteractiveSelector ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>InteractiveSelector</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseInteractiveSelectorDescription',
              "Sélecteur à panneaux extensibles — clique un panneau pour l'étirer en plein cadre, les autres se replient en bandeau. Entrée en cascade au chargement.",
            )}
          </p>
          <InteractiveSelector
            title="Escape in Style"
            subtitle="Discover luxurious camping experiences in nature's most breathtaking spots."
            options={demoInteractiveSelectorOptions}
          />
        </section>

        {/* ── Section : TestimonialCardStack ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>TestimonialCardStack</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseTestimonialCardDescription',
              'Pile de témoignages glissable (verre translucide) — glisse la carte de devant vers la gauche pour la faire tourner en fin de pile.',
            )}
          </p>
          <TestimonialCardStack testimonials={demoTestimonials} />
        </section>

        {/* ── Section : LayoutGrid ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>LayoutGrid</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseLayoutGridDescription',
              "Grille de cartes — clique une carte pour l'étirer en plein cadre (transition de layout partagée), un voile sombre apparaît derrière. Reclique le voile pour refermer.",
            )}
          </p>
          <LayoutGrid items={demoLayoutGridItems} />
        </section>

        {/* ── Section : Carousel (vertical, miniatures, autoplay) ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Carousel · ThumbsSlider</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseVerticalSliderDescription',
              'Carrousel vertical à défilement automatique (2s), navigation par rail de miniatures synchronisé.',
            )}
          </p>
          <div className={styles.verticalSliderWrapper}>
            <Carousel
              options={verticalSliderOptions}
              plugins={[Autoplay({ playOnInit: true, delay: 2000, stopOnMouseEnter: false, stopOnInteraction: false })]}
              dir="ltr"
              className={styles.verticalSliderRoot}
            >
              <SliderContainer className={styles.verticalSliderViewport}>
                {demoVerticalSliderImages.map((image) => (
                  <Slider key={image.alt} className={styles.verticalSliderSlide} thumbnailSrc={image.src}>
                    <img src={image.src} alt={image.alt} className={styles.verticalSliderImage} />
                  </Slider>
                ))}
              </SliderContainer>
              <ThumbsSlider className={styles.verticalSliderThumbs} />
            </Carousel>
          </div>
        </section>
      </main>

      <StaggeredMenuPanel
        isOpen={staggeredMenuOpen}
        onClose={() => setStaggeredMenuOpen(false)}
        position={staggeredMenuPosition}
        items={demoStaggeredItems}
        socialItems={demoStaggeredSocials}
        displaySocials
        displayItemNumbering
        colors={['var(--colors-secondary-300)', 'var(--colors-primary-600)']}
        accentColor="var(--colors-primary-600)"
        closeOnClickAway
      />
    </div>
  );
};

export default ComponentShowcasePage;
