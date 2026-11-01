import React from 'react';
import { Section } from '@egen-civitas/esm-framework';
import { SocialLinks } from './social-links.component';
import { socialLinkRows } from './social-links.data';

// Extension du slot `home-sections` : « Nous suivre ». Ne rend rien tant qu'aucun lien n'est renseigné.
export default function SocialLinksSectionExtension() {
  if (socialLinkRows.length === 0) {
    return null;
  }
  return (
    <Section title="Nous suivre">
      <SocialLinks rows={socialLinkRows} />
    </Section>
  );
}
