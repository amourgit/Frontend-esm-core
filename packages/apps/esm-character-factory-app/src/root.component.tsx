import './asset-base'; // doit rester le PREMIER import (voir asset-base.ts)
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { registerStudioTranslations } from './studio/lib/localization/i18n';
import App from './studio/App';
import { AccountProvider } from './studio/context/AccountContext';
import { AudioProvider } from './studio/context/AudioContext';
import { LanguageProvider } from './studio/context/LanguageContext';
import { SceneProvider } from './studio/context/SceneContext';
import { SoundProvider } from './studio/context/SoundContext';
import { ViewProvider } from './studio/context/ViewContext';
import RouteSync from './route-sync';

const getLibrary = (provider: any) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

// L'ancien index.html chargeait ces ressources globalement ; elles sont désormais
// injectées par l'application elle-même (une seule fois), depuis ses propres assets.
function loadOnce(tag: 'script' | 'link', url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attr = tag === 'script' ? 'src' : 'href';
    if (document.querySelector(`${tag}[data-character-factory="${url}"]`)) return resolve();
    const el: any = document.createElement(tag);
    el.setAttribute('data-character-factory', url);
    if (tag === 'link') el.rel = 'stylesheet';
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Character Factory: échec de chargement de ${url}`));
    el[attr] = url;
    document.head.appendChild(el);
  });
}

export default function Root() {
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // Position réelle du haut de la zone (TopBar, bandeaux éventuels…) : mesurée plutôt que supposée.
  const [stageTop, setStageTop] = useState<number | null>(null);
  // i18n du Core (partagé) : on y enregistre l'espace de noms de l'app avant tout rendu enfant
  const { i18n } = useTranslation();
  useMemo(() => registerStudioTranslations(i18n), [i18n]);

  useEffect(() => {
    const base = (globalThis as any).__EGEN_CHARACTER_FACTORY_ASSETS__ as string;
    Promise.all([loadOnce('script', `${base}/ktx2/libktx.js`), loadOnce('link', `${base}/style.css`)])
      .catch((e) => console.error(e))
      .finally(() => setReady(true));
  }, []);

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
  }, [ready]);

  if (!ready) return null;

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
          background: 'var(--colors-surface-background)',
          color: 'var(--colors-surface-foreground)',
        } as React.CSSProperties
      }
    >
      <canvas id="editor-scene" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      <div id="root" style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <AccountProvider>
            <LanguageProvider>
              <AudioProvider>
                <ViewProvider>
                  <SceneProvider>
                    <SoundProvider>
                      <RouteSync />
                      <Suspense>
                        <App />
                      </Suspense>
                    </SoundProvider>
                  </SceneProvider>
                </ViewProvider>
              </AudioProvider>
            </LanguageProvider>
          </AccountProvider>
        </Web3ReactProvider>
      </div>
    </div>
  );
}
