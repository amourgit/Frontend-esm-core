import React, { useMemo } from 'react';
import { PageBackground, useConfig } from '@egen-civitas/esm-framework';
import type { CharacterFactoryConfig } from './config-schema';

/**
 * Arrière-plan de la page, déclaré au système d'arrière-plan du shell (hôte global `#egen-page-background-container`),
 * comme le font les autres apps. Trois modes (réglage `backgroundMode`) :
 *  - 'color' (défaut) : couleur unie, noir par défaut (`backgroundColor`) ;
 *  - 'theme'          : l'app ne déclare rien -> le shell garde son arrière-plan courant ;
 *  - 'image'          : image (`backgroundImageUrl`).
 * Le canvas 3D est transparent (renderer alpha) : c'est ce fond qui se voit derrière le personnage.
 */
export default function ShellBackground() {
  const { backgroundMode, backgroundColor, backgroundImageUrl } = useConfig<CharacterFactoryConfig>();

  const colorFill = useMemo(
    () => <div data-testid="cf-background-color" style={{ width: '100%', height: '100%', background: backgroundColor }} />,
    [backgroundColor],
  );

  if (backgroundMode === 'theme') return null;
  if (backgroundMode === 'image' && backgroundImageUrl) {
    return <PageBackground imageSrc={backgroundImageUrl} imageFit="cover" showDarkWash={false} />;
  }
  return <PageBackground customComponent={colorFill} />;
}
