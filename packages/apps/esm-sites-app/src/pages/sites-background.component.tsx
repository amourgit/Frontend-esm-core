import React from 'react';
import { PageBackground } from '@egen-civitas/esm-framework';
import sitesBg from '../assets/sites-bg.jpg';

/** Fond de page de l'app Sites (rendu par l'unique arrière-plan global du shell). */
export const SitesBackground: React.FC = () => (
  <PageBackground
    imageSrc={sitesBg}
    imageAlt="Sites & Directions"
    imageFit="cover"
    showAtmosphere={false}
    showDarkWash={false}
    showGlow={false}
    className="opacity-100 bg-transparent"
    imageClassName="opacity-100 blur-[12px] scale-110"
  />
);
