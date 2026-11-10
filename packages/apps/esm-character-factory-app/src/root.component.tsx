import React, { Suspense, useEffect, useMemo, useState } from 'react';
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

declare const __webpack_public_path__: string;

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
  // i18n du Core (partagé) : on y enregistre l'espace de noms de l'app avant tout rendu enfant
  const { i18n } = useTranslation();
  useMemo(() => registerStudioTranslations(i18n), [i18n]);

  useEffect(() => {
    const base = `${__webpack_public_path__}character-factory-assets`;
    Promise.all([loadOnce('script', `${base}/ktx2/libktx.js`), loadOnce('link', `${base}/style.css`)])
      .catch((e) => console.error(e))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <>
      <canvas id="editor-scene" style={{ position: 'fixed', top: 0, left: 0 }} width="100%" height="100%" />
      <div id="root" style={{ overflow: 'hidden' }}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <AccountProvider>
            <LanguageProvider>
              <AudioProvider>
                <ViewProvider>
                  <SceneProvider>
                    <SoundProvider>
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
    </>
  );
}
