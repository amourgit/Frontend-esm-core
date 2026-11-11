import React, { Suspense, useMemo } from 'react';
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

// Chargé À LA DEMANDE par root.component (après lecture de la config et application de la base d'assets) :
// le code hérité lit la base d'assets dès l'évaluation de ses modules.

const getLibrary = (provider: any) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

export default function StudioRoot() {
  // i18n du Core (partagé) : on y enregistre l'espace de noms de l'app avant tout rendu enfant
  const { i18n } = useTranslation();
  useMemo(() => registerStudioTranslations(i18n), [i18n]);

  return (
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
  );
}
