import { useContext, useEffect, useRef } from 'react';
import { interpolateUrl, navigate } from '@egen-civitas/esm-framework';
import { ViewContext, ViewMode } from './studio/context/ViewContext';
import { SceneContext } from './studio/context/SceneContext';

// =============================================================================
//  Synchronisation route du shell <-> vue interne de CharacterStudio
//
//  CharacterStudio navigue par vues internes (ViewContext), sans routeur. Les sous-options du rail EGEN
//  (SectionNavPanel) naviguent, elles, par routes. Seules les vues utilisables directement sont reliées ;
//  APPEARANCE / SAVE / OPTIMIZER / MINT / WALLET restent des étapes internes du parcours.
// =============================================================================

const APP_ROUTE = 'character-factory';

const SEGMENT_TO_VIEW: Record<string, string> = {
  '': ViewMode.LANDING,
  creer: ViewMode.CREATE,
  charger: ViewMode.LOAD,
  'export-lot': ViewMode.BATCHDOWNLOAD,
  manifestes: ViewMode.BATCHMANIFEST,
};

const VIEW_TO_SEGMENT: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENT_TO_VIEW).map(([segment, view]) => [view, segment]),
);

/** Segment après `character-factory` dans l'URL courante, ou null si on n'est pas sur cette app. */
// Vues où un personnage est chargé dans la scène / vues « sans personnage ».
// Les boutons « Retour » d'origine appellent removeCurrentCharacter() + removeCurrentManifest() avant de changer de vue
// (ex. Appearance.jsx, BatchDownload.jsx). Un changement de vue venu du shell (rail, URL, retour arrière) doit faire
// exactement le même nettoyage, sinon l'avatar reste figé dans la scène.
const AVATAR_VIEWS = new Set<string>([ViewMode.APPEARANCE, ViewMode.SAVE]);
const NO_AVATAR_VIEWS = new Set<string>([
  ViewMode.LANDING,
  ViewMode.CREATE,
  ViewMode.LOAD,
  ViewMode.CLAIM,
  ViewMode.BATCHDOWNLOAD,
  ViewMode.BATCHMANIFEST,
]);

function currentSegment(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf(APP_ROUTE);
  return i < 0 ? null : (parts[i + 1] ?? '');
}

export default function RouteSync() {
  const { viewMode, setViewMode } = useContext(ViewContext) as any;
  const { characterManager } = useContext(SceneContext) as any;
  const viewRef = useRef(viewMode);
  const previousView = useRef(viewMode);
  const initialised = useRef(false);

  // URL -> vue (entrée par le rail, lien direct, retour arrière)
  useEffect(() => {
    const apply = () => {
      const segment = currentSegment();
      const target = segment === null ? undefined : SEGMENT_TO_VIEW[segment];
      if (target && target !== viewRef.current) setViewMode(target);
    };
    apply();
    window.addEventListener('popstate', apply);
    window.addEventListener('single-spa:routing-event', apply);
    return () => {
      window.removeEventListener('popstate', apply);
      window.removeEventListener('single-spa:routing-event', apply);
    };
  }, [setViewMode]);

  // vue -> URL (le panneau du rail suit la vue active) ; ignoré au premier rendu pour ne pas écraser un lien direct
  useEffect(() => {
    viewRef.current = viewMode;
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    const segment = VIEW_TO_SEGMENT[viewMode];
    if (segment === undefined || currentSegment() === segment) return;
    const path = `/${APP_ROUTE}${segment ? `/${segment}` : ''}`;
    navigate({ to: interpolateUrl(`\${egenSpaBase}${path}`) });
  }, [viewMode]);

  // Nettoyage de la scène quand on quitte une vue « avec personnage » vers une vue « sans personnage »
  useEffect(() => {
    const previous = previousView.current;
    previousView.current = viewMode;
    if (previous === viewMode || !characterManager) return;
    if (AVATAR_VIEWS.has(previous) && NO_AVATAR_VIEWS.has(viewMode)) {
      characterManager.removeCurrentCharacter();
      characterManager.removeCurrentManifest();
    }
  }, [viewMode, characterManager]);

  return null;
}
