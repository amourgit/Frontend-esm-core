import React, { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@egen-civitas/esm-framework';
import { applyAssetBase } from './asset-base';
import { isWebGLAvailable } from './webgl-support';
import type { CharacterFactoryConfig } from './config-schema';
import ShellBackground from './shell-background';
import { appSection, type AppSection } from './app-section';

// Le moteur (CharacterStudio + three.js) est lourd : il n'est chargé qu'une fois la configuration lue,
// la base d'assets appliquée et WebGL vérifié.
const StudioRoot = React.lazy(() => import('./studio-root'));
const LibraryPage = React.lazy(() => import('./features/library/LibraryPage'));

type Phase = 'checking' | 'ready' | 'no-webgl';

// L'ancien index.html chargeait ces ressources globalement ; elles sont injectées par l'application elle-même
// (une seule fois), depuis ses propres assets.
function loadOnce(tag: 'script' | 'link', url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`${tag}[data-character-factory="${url}"]`)) return resolve();
    const el: any = document.createElement(tag);
    el.setAttribute('data-character-factory', url);
    if (tag === 'link') el.rel = 'stylesheet';
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Character Factory: échec de chargement de ${url}`));
    el[tag === 'script' ? 'src' : 'href'] = url;
    document.head.appendChild(el);
  });
}

function Status({ title, hint, onRetry }: { title: string; hint?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        height: '100%',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--colors-surface-foreground)',
      }}
    >
      <strong>{title}</strong>
      {hint && <span style={{ opacity: 0.75 }}>{hint}</span>}
      {onRetry && (
        <button type="button" onClick={onRetry} style={{ cursor: 'pointer' }}>
          {t('retry', 'Réessayer')}
        </button>
      )}
    </div>
  );
}

// Capte les erreurs de rendu et d'échec de chargement du moteur (réseau, chunk manquant) au lieu d'un écran vide.
class ErrorBoundary extends React.Component<
  { fallback: (retry: () => void) => React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Character Factory:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}

export default function Root() {
  const { t } = useTranslation();
  const config = useConfig<CharacterFactoryConfig>();
  const [phase, setPhase] = useState<Phase>('checking');
  // Sections exclusives (un seul contexte WebGL à la fois) : l'éditeur et la bibliothèque
  const [section, setSection] = useState<AppSection>(() => appSection(window.location.pathname));
  useEffect(() => {
    const update = () => setSection(appSection(window.location.pathname));
    window.addEventListener('popstate', update);
    window.addEventListener('single-spa:routing-event', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('single-spa:routing-event', update);
    };
  }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  // Position réelle du haut de la zone (TopBar, bandeaux éventuels…) : mesurée plutôt que supposée.
  const [stageTop, setStageTop] = useState<number | null>(null);

  useEffect(() => {
    // WebGL n'est indispensable qu'à l'éditeur ; la bibliothèque reste utilisable sans (seul l'aperçu 3D est indisponible)
    if (section === 'studio' && !isWebGLAvailable()) {
      setPhase('no-webgl');
      return;
    }
    const base = applyAssetBase(config?.assetBaseUrl);
    Promise.all([loadOnce('script', `${base}/ktx2/libktx.js`), loadOnce('link', `${base}/style.css`)])
      .catch((e) => console.error(e))
      .finally(() => setPhase('ready'));
  }, [config?.assetBaseUrl, section]);

  // La hauteur disponible = fenêtre - position réelle de la zone - footer/zone basse du shell.
  useLayoutEffect(() => {
    const measure = () => {
      const top = stageRef.current?.getBoundingClientRect().top;
      if (typeof top === 'number') setStageTop(Math.max(0, Math.round(top)));
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, []);

  const retry = useCallback(() => window.location.reload(), []);

  return (
    // Conteneur ancré dans la zone principale du shell (même patron de hauteur que les autres apps).
    // `transform` crée un bloc contenant : les éléments `position: fixed` hérités de CharacterStudio
    // (canvas, panneaux) restent bornés à cette zone au lieu de recouvrir la TopBar et les rails.
    <div
      ref={stageRef}
      className="character-factory-stage"
      style={
        {
          position: 'relative',
          width: '100%',
          // Repli = patron des autres apps ; remplacé par la mesure réelle dès qu'elle est disponible
          height:
            stageTop === null
              ? 'calc(100dvh - var(--egen-navbar-height, 0px) - var(--egen-footer-height, 0px))'
              : `calc(100dvh - ${stageTop}px - var(--egen-footer-height, 0px) - var(--egen-zone-bottom-height, 0px))`,
          overflow: 'hidden',
          transform: 'translateZ(0)',
          // Les unités héritées vh/vw sont converties en cqh/cqw : elles se calent sur CETTE zone
          containerType: 'size',
          color: 'var(--colors-surface-foreground)',
        } as React.CSSProperties
      }
    >
      {/* Arrière-plan de la page : déclaré au shell (hôte global), l'app ne dessine plus de fond opaque */}
      <ShellBackground />
      {phase === 'checking' && <Status title={t('loading', 'Chargement…')} />}
      {phase === 'no-webgl' && (
        <Status
          title={t('webglUnavailable', 'Le rendu 3D est indisponible')}
          hint={t(
            'webglUnavailableHint',
            "Activez l'accélération matérielle dans votre navigateur ou utilisez un navigateur compatible WebGL.",
          )}
        />
      )}
      {phase === 'ready' && (
        <ErrorBoundary
          fallback={(retryRender) => (
            <Status
              title={t('loadError', "Impossible de charger l'éditeur 3D")}
              hint={t('loadErrorHint', 'Vérifiez votre connexion puis réessayez.')}
              onRetry={retryRender}
            />
          )}
        >
          {section === 'library' ? (
            <Suspense fallback={<Status title={t('loading', 'Chargement…')} />}>
              <LibraryPage />
            </Suspense>
          ) : (
            <>
              <canvas id="editor-scene" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              <Suspense fallback={<Status title={t('loading', 'Chargement…')} />}>
                <StudioRoot />
              </Suspense>
            </>
          )}
        </ErrorBoundary>
      )}
    </div>
  );
}
