import React from 'react';
import { Section, showToast } from '@egen-civitas/esm-framework';
import { HeroMosaic } from './hero-mosaic.component';
import { heroMainTile, heroSecondaryTiles } from './hero.data';

// Extension du slot `home-sections` : mosaïque « À la une ».
export default function HeroSectionExtension() {
  return (
    <Section title="À la une">
      <HeroMosaic
        mainTile={heroMainTile}
        secondaryTiles={heroSecondaryTiles}
        onSelectTile={(tile) => showToast({ kind: 'info', description: `Ouverture de « ${tile.title} »` })}
      />
    </Section>
  );
}
